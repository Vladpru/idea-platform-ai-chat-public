import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { scheduleHighlightDirtyComment } from '@/features/discussion/lib/highlight-dirty-comment';
import { useDiscussionUiStore } from '@/features/discussion/model/discussion-ui-store';
import { DiscussionTab } from '@/features/discussion/ui/DiscussionTab';
import {
  useIdeaDetailsQuery,
  useSimilarIdeasQuery,
} from '@/features/idea-details/lib/use-idea-details-queries';
import type {
  IdeaDetails,
  IdeaTabId,
} from '@/features/idea-details/model/idea-details.types';
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
import { useUpdateIdea } from '@/features/ideas/hooks/use-update-idea';
import { IdeaForm } from '@/features/ideas/ui/idea-form/IdeaForm';
import { useBlocker, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import { AnimatedPanel, AnimatedPanelSwitch } from '@/shared/ui/motion';
import { SuccessModal } from '@/shared/ui/success-modal';
import { TeamModal } from '@/features/idea-details/modals/TeamModal';

import { AnimatePresence, motion } from 'framer-motion';

import { IdeaHeader } from './IdeaHeader';
import { IdeaStatsFooter } from './IdeaStatsFooter';
import { IdeaTabs } from './IdeaTabs';
import { IdeaTagCloud } from './IdeaTagCloud';
import { IdeaAttachmentsTab } from './attachments/IdeaAttachmentsTab';
import { IdeaLinkedProblemsTab } from './linked-problems/IdeaLinkedProblemsTab';
import { SimilarIdeasWidget } from './similar/SimilarIdeasWidget';
import { NotFoundPage } from '@/pages/not-found';

import { IdeaDetailsPageSkeleton } from './skeletons/IdeaDetailsPageSkeleton';

type IdeaDetailsViewProps = {
  ideaId: string;
};

type PendingDiscardAction = 'cancel-edit' | 'navigate-back' | 'tab-switch';

export function IdeaDetailsView({ ideaId }: IdeaDetailsViewProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const formId = useId();
  const [activeTab, setActiveTab] = useState<IdeaTabId>('description');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormSnapshot, setEditFormSnapshot] =
    useState<IdeaEditFormValues | null>(null);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [ideaDiscardModalOpen, setIdeaDiscardModalOpen] = useState(false);
  const [updatedSuccessOpen, setUpdatedSuccessOpen] = useState(false);
  const [pendingDiscardAction, setPendingDiscardAction] =
    useState<PendingDiscardAction | null>(null);
  const [pendingTab, setPendingTab] = useState<IdeaTabId | null>(null);
  const [showDiscussionDiscardModal, setShowDiscussionDiscardModal] =
    useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isEditingDirty = useDiscussionUiStore(s => s.isEditingDirty);
  const discardAllUnsaved = useDiscussionUiStore(s => s.discardAllUnsaved);
  const userId = useAuthSessionStore(s => s.user?.id);

  const { data: idea, isPending, isError, isSuccess } =
    useIdeaDetailsQuery(ideaId);
  const updateMutation = useUpdateIdea(ideaId, idea?.status ?? 'DRAFT');

  const { data: similarIdeas = [], isLoading: isSimilarLoading } =
    useSimilarIdeasQuery(ideaId, {
      enabled: isSuccess && Boolean(idea) && !isEditing,
    });

  const hasUnsavedIdeaEdits = isEditing && hasUnsavedEdits;

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasUnsavedIdeaEdits,
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

  const exitEditMode = useCallback(() => {
    setIsEditing(false);
    setEditFormSnapshot(null);
    setHasUnsavedEdits(false);
  }, []);

  const handleFormSubmit = (values: IdeaEditFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        exitEditMode();
        setUpdatedSuccessOpen(true);
      },
    });
  };

  const handleStartEdit = (currentIdea: IdeaDetails) => {
    setActiveTab('description');
    setEditFormSnapshot(ideaDetailsToEditFormValues(currentIdea));
    setHasUnsavedEdits(false);
    setIsEditing(true);
  };

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
    if (isEditing && hasUnsavedEdits) {
      requestDiscardConfirmation('navigate-back');
      return;
    }
    router.history.back();
  };

  const handleUpdatedSuccessClose = () => {
    setUpdatedSuccessOpen(false);
  };

  const handleTabChange = useCallback(
    (tab: IdeaTabId) => {
      if (tab === activeTab) {
        return;
      }

      if (hasUnsavedIdeaEdits) {
        setPendingDiscardAction('tab-switch');
        setPendingTab(tab);
        setIdeaDiscardModalOpen(true);
        return;
      }

      if (activeTab === 'discussion' && isEditingDirty && tab !== activeTab) {
        setPendingTab(tab);
        scheduleHighlightDirtyComment(() => {
          setShowDiscussionDiscardModal(true);
        });
        return;
      }

      setActiveTab(tab);
    },
    [activeTab, hasUnsavedIdeaEdits, isEditingDirty],
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

  useEffect(() => {
    if (!hasUnsavedIdeaEdits) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedIdeaEdits]);

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
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6 bg-white px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
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

        <div className="sticky top-[56px] z-30 -mx-4 bg-white px-4 py-2 shadow-sm transition-all duration-300 sm:-mx-6 sm:px-6">
          <IdeaHeader
            idea={idea}
            isAuthor={isAuthor}
            isEditing={isEditing}
            isCompact={isScrolled}
            showProjectActions={!isEditing}
            onStartEdit={() => handleStartEdit(idea)}
            onDeleteSuccess={() => {
              void navigate({ to: ROUTES.ideas, search: { sort: 'newest' } });
            }}
            onTeamClick={() => setIsTeamModalOpen(true)}
            onBackClick={handleBackClick}
          />

          {!isEditing ? (
            <IdeaTabs
              activeTab={activeTab}
              onChange={handleTabChange}
              idea={{ commentCount: idea.commentCount }}
              counts={{
                attachments: idea.attachments.length,
                linkedProblems: visibleProblems.length,
              }}
            />
          ) : null}
        </div>

        <div className="min-h-[280px]">
          {isEditing && editFormSnapshot ? (
            <section
              key="edit"
              className="animate-in fade-in duration-200"
              aria-label="Edit idea"
            >
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
              {activeTab === 'description' && (
                <AnimatedPanel
                  panelKey="description"
                  className="space-y-6"
                  aria-label="Description"
                >
                  {idea.mainImageUrl ? (
                    <div className="border-brand-gray-200 overflow-hidden rounded-lg border bg-white">
                      <img
                        src={idea.mainImageUrl}
                        alt=""
                        className="aspect-video max-h-[400px] w-full object-cover"
                      />
                    </div>
                  ) : null}
                  {idea.description ? (
                    <p className="text-brand-gray-800 font-EB-Garamond max-w-3xl text-sm leading-relaxed whitespace-pre-wrap sm:text-base">
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

              {activeTab === 'attachments' && (
                <AnimatedPanel panelKey="attachments">
                  <IdeaAttachmentsTab attachments={idea.attachments} />
                </AnimatedPanel>
              )}

              {activeTab === 'discussion' && (
                <AnimatedPanel panelKey="discussion">
                  <DiscussionTab
                    entityType="IDEA"
                    entityId={ideaId}
                    enabled={activeTab === 'discussion'}
                  />
                </AnimatedPanel>
              )}

              {activeTab === 'linked-problems' && (
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
        ) : activeTab === 'description' ? (
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
