import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  useIdeaDetailsQuery,
  useSimilarIdeasQuery,
} from '@/features/idea-details/lib/use-idea-details-queries';
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
  IDEA_DELETED_SUCCESS_DESCRIPTION,
  IDEA_DELETED_SUCCESS_TITLE,
  IDEA_UNDO_CHANGES_DESCRIPTION,
  IDEA_UNDO_CHANGES_TITLE,
  IDEA_UPDATED_SUCCESS_DESCRIPTION,
  IDEA_UPDATED_SUCCESS_TITLE,
} from '@/features/ideas/lib/modals/copy';
import { outlineBtnClass, primaryBtnClass } from '@/features/ideas/lib/styles';
import { useUpdateIdea } from '@/features/ideas/hooks/use-update-idea';
import {
  useIdeaDetailsQuery,
  useSimilarIdeasQuery,
} from '@/features/idea-details/lib/use-idea-details-queries';
import type {
  IdeaDetails,
  IdeaTabId,
} from '@/features/idea-details/model/idea-details.types';
import { IdeaForm } from '@/features/ideas/ui/idea-form/IdeaForm';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useState,
  type MouseEvent,
} from 'react';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ConfirmModal } from '@/shared/ui/confirm-modal';
import {
  AnimatedPanel,
  AnimatedPanelSwitch,
} from '@/shared/ui/motion';
import { SuccessModal } from '@/shared/ui/success-modal';
import { IdeaAttachmentsTab } from './attachments/IdeaAttachmentsTab';
import { TeamModal } from '@/features/idea-details/modals/TeamModal';

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

type PendingDiscardAction = 'cancel-edit' | 'navigate-back';

type IdeaDetailsErrorStateProps = {
  message: string;
};

function IdeaDetailsErrorState({ message }: IdeaDetailsErrorStateProps) {
  return (
    <main className="bg-brand-neutral flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="border-brand-gray-200 max-w-md rounded-lg border bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-brand-black text-lg font-bold tracking-wide uppercase">
          Idea not found
        </p>
        <p className="text-brand-gray-600 mt-3 text-sm">{message}</p>
        <Link
          to={ROUTES.ideas}
          className="bg-brand-dark-blue hover:bg-brand-dark-blue/90 mt-6 inline-flex h-10 items-center justify-center rounded-sm px-6 text-xs font-bold tracking-wide text-white uppercase transition-colors"
        >
          Back to ideas
        </Link>
      </div>
    </main>
  );
}

export function IdeaDetailsView({ ideaId }: IdeaDetailsViewProps) {
  const navigate = useNavigate();
  const formId = useId();
  const [activeTab, setActiveTab] = useState<IdeaTabId>('description');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormSnapshot, setEditFormSnapshot] =
    useState<IdeaEditFormValues | null>(null);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [undoModalOpen, setUndoModalOpen] = useState(false);
  const [updatedSuccessOpen, setUpdatedSuccessOpen] = useState(false);
  const [deletedSuccessOpen, setDeletedSuccessOpen] = useState(false);
  const [pendingDiscardAction, setPendingDiscardAction] =
    useState<PendingDiscardAction | null>(null);
  const userId = useAuthSessionStore(s => s.user?.id);

  const { data: idea, isLoading, isError, error } = useIdeaDetailsQuery(ideaId);
  const updateMutation = useUpdateIdea(ideaId, idea?.status ?? 'DRAFT');

  const { data: similarIdeas = [], isLoading: isSimilarLoading } =
    useSimilarIdeasQuery(ideaId, { enabled: !isEditing });

  const requestDiscardConfirmation = useCallback(
    (action: PendingDiscardAction) => {
      setPendingDiscardAction(action);
      setUndoModalOpen(true);
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

  const handleConfirmDiscard = () => {
    const action = pendingDiscardAction;
    setUndoModalOpen(false);
    setPendingDiscardAction(null);
    exitEditMode();

    if (action === 'navigate-back') {
      void navigate({ to: ROUTES.ideas });
    }
  };

  const handleUndoModalOpenChange = (open: boolean) => {
    setUndoModalOpen(open);
    if (!open) {
      setPendingDiscardAction(null);
    }
  };

  const handleBackClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isEditing || !hasUnsavedEdits) {
      return;
    }
    event.preventDefault();
    requestDiscardConfirmation('navigate-back');
  };

  const handleUpdatedSuccessClose = () => {
    setUpdatedSuccessOpen(false);
  };

  const handleDeletedSuccessClose = () => {
    setDeletedSuccessOpen(false);
    void navigate({ to: ROUTES.profileIdeas });
  };

  useEffect(() => {
    if (!isEditing || !hasUnsavedEdits) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isEditing, hasUnsavedEdits]);

  if (isLoading) {
    return <IdeaDetailsPageSkeleton />;
  }

  if (isError || !idea) {
    const message = isError
      ? getApiErrorMessage(error, {
          invalidCredentialsMessage:
            'We could not load this idea. It may have been removed or you may not have access.',
        })
      : 'This idea does not exist or is no longer available.';
    return <IdeaDetailsErrorState message={message} />;
  }

  const isAuthor = Boolean(userId && userId === idea.authorId);

  const visibleProblems = idea.linkedProblems.filter(
    p => p.status !== 'DRAFT' || isAuthor,
  );

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6 bg-white px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        <div className="flex items-center">
          <Link
            to={ROUTES.ideas}
            onClick={handleBackClick}
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-bold tracking-wide uppercase transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>

        <IdeaHeader
          idea={idea}
          isAuthor={isAuthor}
          isEditing={isEditing}
          showProjectActions={!isEditing}
          onStartEdit={() => handleStartEdit(idea)}
          onDeleteSuccess={() => setDeletedSuccessOpen(true)}
          onTeamClick={() => setIsTeamModalOpen(true)}
        />

        {!isEditing ? (
          <IdeaTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            counts={{
              attachments: idea.attachments.length,
              linkedProblems: visibleProblems.length,
              discussion: 0,
            }}
          />
        ) : null}

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

                  <IdeaTagCloud tags={idea.tags} />

                  <IdeaStatsFooter
                    createdAt={idea.createdAt}
                    stats={idea.stats}
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
                  <div className="py-16 text-center font-medium text-gray-500">
                    This section will be available soon.
                  </div>
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
        open={undoModalOpen}
        onOpenChange={handleUndoModalOpenChange}
        title={IDEA_UNDO_CHANGES_TITLE}
        description={IDEA_UNDO_CHANGES_DESCRIPTION}
        confirmLabel="YES"
        cancelLabel="NO"
        onConfirm={handleConfirmDiscard}
      />

      <SuccessModal
        open={updatedSuccessOpen}
        onOpenChange={setUpdatedSuccessOpen}
        title={IDEA_UPDATED_SUCCESS_TITLE}
        description={IDEA_UPDATED_SUCCESS_DESCRIPTION}
        onClose={handleUpdatedSuccessClose}
      />

      <SuccessModal
        open={deletedSuccessOpen}
        onOpenChange={setDeletedSuccessOpen}
        title={IDEA_DELETED_SUCCESS_TITLE}
        description={IDEA_DELETED_SUCCESS_DESCRIPTION}
        buttonLabel="YES"
        onClose={handleDeletedSuccessClose}
      />
    </main>
  );
}
