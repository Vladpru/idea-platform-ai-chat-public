import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { scheduleHighlightDirtyComment } from '@/features/discussion/lib/highlight-dirty-comment';
import { useDiscussionUiStore } from '@/features/discussion/model/discussion-ui-store';
import { DiscussionTab } from '@/features/discussion/ui/DiscussionTab';
import { EntityAiSummaryBlock } from '@/features/entity-ai-summary/EntityAiSummaryBlock';
import {
  useIdeaDetailsQuery,
  useSimilarIdeasQuery,
} from '@/features/idea-details/lib/use-idea-details-queries';
import { TeamModal } from '@/features/idea-details/modals/TeamModal';
import type {
  IdeaDetails,
  IdeaTabId,
} from '@/features/idea-details/model/idea-details.types';
import { useUpdateIdea } from '@/features/ideas/hooks/use-update-idea';
import {
  type IdeaEditFormValues,
  ideaDetailsToEditFormValues,
} from '@/features/ideas/lib/edit-idea';
import {
  IDEA_UNDO_CHANGES_DESCRIPTION,
  IDEA_UNDO_CHANGES_TITLE,
  IDEA_UPDATED_SUCCESS_DESCRIPTION,
  IDEA_UPDATED_SUCCESS_TITLE,
} from '@/features/ideas/lib/modals/copy';
import { outlineBtnClass, primaryBtnClass } from '@/features/ideas/lib/styles';
import { IdeaEditorPageHeading } from '@/features/ideas/ui/IdeaEditorPageHeading';
import { IdeaForm } from '@/features/ideas/ui/idea-form/IdeaForm';
import { NotFoundPage } from '@/pages/not-found';
import {
  useBlocker,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { ROUTES } from '@/shared/config/paths';
import { entityDescriptionDetailClass } from '@/shared/lib/entity-description-classes';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import { AnimatedPanel, AnimatedPanelSwitch } from '@/shared/ui/motion';
import { SuccessModal } from '@/shared/ui/success-modal';

import { IdeaHeader } from './IdeaHeader';
import { IdeaStatsFooter } from './IdeaStatsFooter';
import { IdeaTabs } from './IdeaTabs';
import { IdeaTagCloud } from './IdeaTagCloud';
import { IdeaAttachmentsTab } from './attachments/IdeaAttachmentsTab';
import { IdeaLinkedProblemsTab } from './linked-problems/IdeaLinkedProblemsTab';
import { SimilarIdeasWidget } from './similar/SimilarIdeasWidget';
import { IdeaDetailsPageSkeleton } from './skeletons/IdeaDetailsPageSkeleton';

type IdeaDetailsViewProps = {
  ideaId: string;
};

type PendingDiscardAction = 'cancel-edit' | 'navigate-back' | 'tab-switch';

export function IdeaDetailsView({ ideaId }: IdeaDetailsViewProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const {
    edit: isEditSearch,
    updated: showUpdatedSuccess,
    replyTo: replyToCommentId,
    tab: searchTab,
    sort: discussionSort,
  } = useSearch({
    from: '/_auth/ideas/$ideaId',
  });
  const formId = useId();
  const [activeTab, setActiveTab] = useState<IdeaTabId>(() => {
    if (replyToCommentId || searchTab === 'discussion') {
      return 'discussion';
    }
    return 'description';
  });
  const searchTabOverride: IdeaTabId | null =
    replyToCommentId || searchTab === 'discussion' ? 'discussion' : null;
  const visibleTab = searchTabOverride ?? activeTab;
  const [isEditing, setIsEditing] = useState(false);
  const [editFormSnapshot, setEditFormSnapshot] =
    useState<IdeaEditFormValues | null>(null);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [ideaDiscardModalOpen, setIdeaDiscardModalOpen] = useState(false);
  const [updatedSuccessOpen, setUpdatedSuccessOpen] = useState(false);
  const [prevShowUpdatedSuccess, setPrevShowUpdatedSuccess] =
    useState(showUpdatedSuccess);
  const [pendingDiscardAction, setPendingDiscardAction] =
    useState<PendingDiscardAction | null>(null);
  const [pendingTab, setPendingTab] = useState<IdeaTabId | null>(null);
  const [showDiscussionDiscardModal, setShowDiscussionDiscardModal] =
    useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const skipEditNavigationBlockRef = useRef(false);
  const hasRestoredEditFromUrlRef = useRef(false);

  if (showUpdatedSuccess !== prevShowUpdatedSuccess) {
    setPrevShowUpdatedSuccess(showUpdatedSuccess);
    if (showUpdatedSuccess) {
      setUpdatedSuccessOpen(true);
    }
  }

  const isEditingDirty = useDiscussionUiStore(s => s.isEditingDirty);
  const discardAllUnsaved = useDiscussionUiStore(s => s.discardAllUnsaved);
  const userId = useAuthSessionStore(s => s.user?.id);

  const {
    data: idea,
    isPending,
    isError,
    isSuccess,
  } = useIdeaDetailsQuery(ideaId);
  const updateMutation = useUpdateIdea(ideaId, idea?.status ?? 'DRAFT');

  const { data: similarIdeas = [], isLoading: isSimilarLoading } =
    useSimilarIdeasQuery(ideaId, {
      enabled: isSuccess && Boolean(idea) && !isEditing,
    });

  const hasUnsavedIdeaEdits = isEditing && hasUnsavedEdits;

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => {
      if (skipEditNavigationBlockRef.current) {
        return false;
      }

      return hasUnsavedIdeaEdits;
    },
    enableBeforeUnload: () =>
      hasUnsavedIdeaEdits && !skipEditNavigationBlockRef.current,
    withResolver: true,
  });

  const isIdeaDiscardModalOpen = ideaDiscardModalOpen || status === 'blocked';

  const isDiscussionDiscardModalOpen = showDiscussionDiscardModal;

  const requestDiscardConfirmation = useCallback(
    (action: PendingDiscardAction) => {
      setPendingDiscardAction(action);
      setIdeaDiscardModalOpen(true);
    },
    [],
  );

  const exitEditMode = useCallback(
    (options?: { bypassBlocker?: boolean }) => {
      if (options?.bypassBlocker) {
        skipEditNavigationBlockRef.current = true;
      }

      setIsEditing(false);
      setEditFormSnapshot(null);
      setHasUnsavedEdits(false);
      setIdeaDiscardModalOpen(false);
      setPendingDiscardAction(null);

      if (isEditSearch) {
        void navigate({
          to: ROUTES.ideaDetail(ideaId),
          search: previous => {
            const next = { ...previous };
            delete next.edit;
            return next;
          },
          replace: true,
        });
      }

      if (options?.bypassBlocker) {
        queueMicrotask(() => {
          skipEditNavigationBlockRef.current = false;
        });
      }
    },
    [ideaId, isEditSearch, navigate],
  );

  const handleFormSubmit = (values: IdeaEditFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        exitEditMode({ bypassBlocker: true });
        setUpdatedSuccessOpen(true);
      },
    });
  };

  const enterEditMode = useCallback((currentIdea: IdeaDetails) => {
    setActiveTab('description');
    setEditFormSnapshot(ideaDetailsToEditFormValues(currentIdea));
    setHasUnsavedEdits(false);
    setIdeaDiscardModalOpen(false);
    setPendingDiscardAction(null);
    setIsEditing(true);
    hasRestoredEditFromUrlRef.current = true;
  }, []);

  const handleStartEdit = useCallback(
    (currentIdea: IdeaDetails) => {
      enterEditMode(currentIdea);
      void navigate({
        to: ROUTES.ideaDetail(currentIdea.id),
        search: previous => ({ ...previous, edit: true }),
        replace: true,
      });
    },
    [enterEditMode, navigate],
  );

  const handleCancelEdit = () => {
    if (hasUnsavedEdits) {
      requestDiscardConfirmation('cancel-edit');
      return;
    }
    exitEditMode();
  };

  const handleConfirmIdeaDiscard = () => {
    const action = pendingDiscardAction;
    const tab = pendingTab;
    const wasBlocked = status === 'blocked';

    exitEditMode();
    setIdeaDiscardModalOpen(false);
    setPendingDiscardAction(null);
    setPendingTab(null);

    if (wasBlocked) {
      proceed?.();
      return;
    }

    if (action === 'navigate-back') {
      router.history.back();
    } else if (action === 'tab-switch' && tab) {
      setActiveTab(tab);
    }
  };

  const handleIdeaDiscardModalOpenChange = (open: boolean) => {
    if (!open) {
      if (status === 'blocked') {
        reset?.();
      }
      setIdeaDiscardModalOpen(false);
      setPendingDiscardAction(null);
      setPendingTab(null);
    }
  };

  const handleBackClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isEditing) {
      if (hasUnsavedEdits) {
        requestDiscardConfirmation('navigate-back');
        return;
      }
      exitEditMode();
      return;
    }
    router.history.back();
  };

  const handleUpdatedSuccessClose = () => {
    setUpdatedSuccessOpen(false);
  };

  const handleTabChange = useCallback(
    (tab: IdeaTabId) => {
      if (tab === visibleTab) {
        return;
      }

      if (hasUnsavedIdeaEdits) {
        setPendingDiscardAction('tab-switch');
        setPendingTab(tab);
        setIdeaDiscardModalOpen(true);
        return;
      }

      if (visibleTab === 'discussion' && isEditingDirty && tab !== visibleTab) {
        setPendingTab(tab);
        scheduleHighlightDirtyComment(() => {
          setShowDiscussionDiscardModal(true);
        });
        return;
      }

      setActiveTab(tab);
    },
    [visibleTab, hasUnsavedIdeaEdits, isEditingDirty],
  );

  const handleConfirmDiscussionTabDiscard = () => {
    discardAllUnsaved();
    if (pendingTab) {
      setActiveTab(pendingTab);
    }
    setPendingTab(null);
    setShowDiscussionDiscardModal(false);
  };

  const handleDiscussionDiscardModalOpenChange = (open: boolean) => {
    if (!open) {
      setPendingTab(null);
      setShowDiscussionDiscardModal(false);
    }
  };

  const handleReplyToConsumed = useCallback(() => {
    setActiveTab('discussion');
    void navigate({
      to: '/ideas/$ideaId',
      params: { ideaId },
      search: {
        ...(discussionSort ? { sort: discussionSort } : {}),
        ...(isEditSearch ? { edit: isEditSearch } : {}),
        ...(showUpdatedSuccess ? { updated: showUpdatedSuccess } : {}),
      },
      replace: true,
    });
  }, [discussionSort, ideaId, isEditSearch, navigate, showUpdatedSuccess]);

  useEffect(() => {
    if (!showUpdatedSuccess) {
      return;
    }

    skipEditNavigationBlockRef.current = true;
    void navigate({
      to: ROUTES.ideaDetail(ideaId),
      search: previous => {
        const next = { ...previous };
        delete next.updated;
        return next;
      },
      replace: true,
    });
    queueMicrotask(() => {
      skipEditNavigationBlockRef.current = false;
    });
  }, [ideaId, navigate, showUpdatedSuccess]);

  useEffect(() => {
    if (
      !idea ||
      !isEditSearch ||
      isEditing ||
      hasRestoredEditFromUrlRef.current
    ) {
      return;
    }

    hasRestoredEditFromUrlRef.current = true;
    enterEditMode(idea);
  }, [enterEditMode, idea, isEditSearch, isEditing]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsScrolled(prev => {
            if (scrollY > 150 && !prev) return true;
            if (scrollY < 80 && prev) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPending) {
    return <IdeaDetailsPageSkeleton />;
  }

  if (isError || !idea) {
    return <NotFoundPage variant="content" />;
  }

  const isAuthor =
    idea.viewer.isAuthor || Boolean(userId && userId === idea.authorId);

  const visibleProblems = idea.linkedProblems.filter(
    p => p.status !== 'DRAFT' || isAuthor,
  );

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="bg-card mx-auto max-w-5xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        {isEditing ? (
          <div className="pb-2">
            <button
              type="button"
              onClick={handleBackClick}
              className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1 text-xs font-bold tracking-wide uppercase transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {!isScrolled ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center pb-2">
                    <button
                      type="button"
                      onClick={handleBackClick}
                      className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1 text-xs font-bold tracking-wide uppercase transition-colors"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="bg-card sticky top-[56px] z-30 -mx-4 px-4 py-2 shadow-none transition-all duration-300 sm:-mx-6 sm:px-6">
              <IdeaHeader
                idea={idea}
                isAuthor={isAuthor}
                isEditing={false}
                isCompact={isScrolled}
                showProjectActions={true}
                onStartEdit={() => handleStartEdit(idea)}
                onDeleteSuccess={() => {
                  void navigate({
                    to: ROUTES.ideas,
                    search: { sort: 'newest' },
                  });
                }}
                onTeamClick={() => setIsTeamModalOpen(true)}
                onBackClick={handleBackClick}
              />

              <IdeaTabs
                activeTab={visibleTab}
                onChange={handleTabChange}
                idea={{ commentCount: idea.commentCount }}
                counts={{
                  attachments: idea.attachments.length,
                  linkedProblems: visibleProblems.length,
                }}
              />
            </div>
          </>
        )}

        <div
          className={cn(
            !isEditing && visibleTab !== 'description' && 'min-h-[280px]',
          )}
        >
          {isEditing && editFormSnapshot ? (
            <section
              key="edit"
              className="animate-in fade-in duration-200"
              aria-label="Edit idea"
            >
              <IdeaEditorPageHeading />
              <IdeaForm
                key={`edit-${idea.id}`}
                formId={formId}
                initialData={editFormSnapshot}
                isSubmitting={updateMutation.isPending}
                onDirtyChange={setHasUnsavedEdits}
                onSubmit={handleFormSubmit}
              />
            </section>
          ) : (
            <AnimatedPanelSwitch>
              {visibleTab === 'description' && (
                <AnimatedPanel
                  panelKey="description"
                  className="space-y-6"
                  aria-label="Description"
                >
                  {idea.mainImageUrl ? (
                    <div className="border-brand-gray-200 bg-card overflow-hidden rounded-lg border">
                      <img
                        src={idea.mainImageUrl}
                        alt=""
                        className="aspect-video max-h-[400px] w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <EntityAiSummaryBlock
                    aiSummary={idea.aiSummary}
                    summaryStatus={idea.summaryStatus}
                  />
                  {idea.description ? (
                    <p className={entityDescriptionDetailClass}>
                      {idea.description}
                    </p>
                  ) : (
                    <p className="text-brand-gray-500 text-sm italic">
                      No description provided yet.
                    </p>
                  )}

                  <IdeaTagCloud tags={idea.tags} showAll={true} />

                  <IdeaStatsFooter
                    createdAt={idea.createdAt}
                    stats={idea.stats}
                    entityId={idea.id}
                    entityType="IDEA"
                    isLiked={idea.isLiked}
                  />
                </AnimatedPanel>
              )}

              {visibleTab === 'attachments' && (
                <AnimatedPanel panelKey="attachments">
                  <IdeaAttachmentsTab attachments={idea.attachments} />
                </AnimatedPanel>
              )}

              {visibleTab === 'discussion' && (
                <AnimatedPanel panelKey="discussion">
                  <DiscussionTab
                    entityType="IDEA"
                    entityId={ideaId}
                    enabled={visibleTab === 'discussion'}
                    replyToCommentId={replyToCommentId}
                    onReplyToConsumed={handleReplyToConsumed}
                  />
                </AnimatedPanel>
              )}

              {visibleTab === 'linked-problems' && (
                <AnimatedPanel panelKey="linked-problems">
                  <IdeaLinkedProblemsTab
                    ideaId={ideaId}
                    problems={visibleProblems}
                    isAuthor={isAuthor}
                  />
                </AnimatedPanel>
              )}
            </AnimatedPanelSwitch>
          )}
        </div>

        {isEditing ? (
          <div
            key="edit-actions"
            className="border-brand-gray-200 animate-in fade-in flex flex-col gap-3 border-t pt-8 duration-200 sm:flex-row sm:justify-end"
          >
            <Button
              type="button"
              variant="outline"
              className={cn(outlineBtnClass, 'w-full sm:w-auto')}
              disabled={updateMutation.isPending}
              onClick={handleCancelEdit}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              form={formId}
              className={cn(primaryBtnClass, 'w-full sm:w-auto')}
              disabled={updateMutation.isPending}
              isLoading={updateMutation.isPending}
            >
              SAVE CHANGES
            </Button>
          </div>
        ) : visibleTab === 'description' ? (
          <SimilarIdeasWidget
            ideaId={ideaId}
            similarIdeas={similarIdeas}
            isLoading={isSimilarLoading}
            className={cn('border-brand-gray-200 border-t pt-8')}
          />
        ) : null}
      </div>

      {isTeamModalOpen ? (
        <TeamModal
          ideaId={idea.id}
          author={idea.author}
          members={idea.members}
          viewer={idea.viewer}
          onClose={() => setIsTeamModalOpen(false)}
        />
      ) : null}

      <ConfirmModal
        open={isIdeaDiscardModalOpen}
        onOpenChange={handleIdeaDiscardModalOpenChange}
        title={IDEA_UNDO_CHANGES_TITLE}
        description={IDEA_UNDO_CHANGES_DESCRIPTION}
        confirmLabel="YES"
        cancelLabel="NO"
        onConfirm={handleConfirmIdeaDiscard}
      />

      <ConfirmModal
        open={isDiscussionDiscardModalOpen}
        onOpenChange={handleDiscussionDiscardModalOpenChange}
        title="Discard unsaved changes?"
        description="You have unsaved changes in your comment edit. Leaving this tab will discard them."
        confirmLabel="DISCARD"
        cancelLabel="STAY"
        onConfirm={handleConfirmDiscussionTabDiscard}
      />

      <SuccessModal
        open={updatedSuccessOpen}
        onOpenChange={setUpdatedSuccessOpen}
        title={IDEA_UPDATED_SUCCESS_TITLE}
        description={IDEA_UPDATED_SUCCESS_DESCRIPTION}
        onClose={handleUpdatedSuccessClose}
      />
    </main>
  );
}
