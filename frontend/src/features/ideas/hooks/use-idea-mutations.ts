import {
  type CreateIdeaPayload,
  type UpdateIdeaPayload,
  type UploadIdeaMediaPayload,
  createIdea,
  deleteIdea,
  deleteIdeaMedia,
  joinIdea,
  leaveIdea,
  linkProblemsToIdea,
  unlinkProblemFromIdea,
  uploadIdeaMedia,
} from '@/features/ideas/api/ideas.api';
import { myIdeasDashboardKeys } from '@/features/profile/hooks/use-my-ideas-dashboard';
import {
  type IdeaCreateFormValues,
  formValuesToSavePayload,
} from '@/features/ideas/lib/create-idea';
import {
  IDEA_STATUS,
  type ApiStage,
  type IdeaApi,
  type IdeaStatus,
} from '@/features/ideas/model/idea.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import { type LocalIdea } from '@/shared/offline/db';
import {
  createIdea as createLocalIdea,
  publishIdea as publishLocalIdea,
  updateIdea as updateLocalIdea,
} from '@/shared/offline/repositories';
import { drain } from '@/shared/offline/sync-engine';

type IdeaEditInput = {
  values: IdeaCreateFormValues;
  payload: ReturnType<typeof formValuesToSavePayload>;
};

function toUpdateIdeaInput({ values, payload }: IdeaEditInput) {
  return {
    title: payload.title ?? undefined,
    description: payload.description ?? undefined,
    stage: payload.stage ?? undefined,
    problemIds: payload.problemIds,
    tagLabels: payload.tagLabels,
    mainImage: values.mainImage ?? null,
    attachments: values.files,
  };
}

function requireAuthorId(): string {
  const authorId = useAuthSessionStore.getState().user?.id;
  if (!authorId) throw new Error('No authenticated user');
  return authorId;
}

function localIdeaToIdeaApi(local: LocalIdea): IdeaApi {
  return {
    id: local.localId,
    authorId: local.authorId,
    status: local.status as IdeaStatus,
    stage: local.stage as ApiStage | null,
    title: local.title,
    description: (local.snapshot.description as string | null) ?? null,
    publishedAt: local.status === IDEA_STATUS.PUBLISHED ? local.updatedAt : null,
    createdAt: local.updatedAt,
    updatedAt: local.updatedAt,
  };
}

export const ideaMutationKeys = {
  all: ['ideas'] as const,
  lists: () => [...ideaMutationKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...ideaMutationKeys.lists(), params] as const,
  infinite: (params?: Record<string, unknown>) =>
    [...ideaMutationKeys.all, 'infinite', params] as const,
  details: () => [...ideaMutationKeys.all, 'detail'] as const,
  detail: (ideaId: string) => [...ideaMutationKeys.details(), ideaId] as const,
};

export function invalidateIdeaQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  ideaId?: string,
  { invalidateDashboard = false }: { invalidateDashboard?: boolean } = {},
) {
  void queryClient.invalidateQueries({ queryKey: ideaMutationKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: ideaMutationKeys.all });
  if (ideaId) {
    void queryClient.invalidateQueries({
      queryKey: ideaMutationKeys.detail(ideaId),
    });
  }
  if (invalidateDashboard) {
    void queryClient.invalidateQueries({ queryKey: myIdeasDashboardKeys.all });
  }
}

type SaveIdeaDraftVariables = {
  values: IdeaCreateFormValues;
  ideaId: string | null;
};

export function useSaveIdeaDraftMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'save-draft'],
    mutationFn: async ({ values, ideaId }: SaveIdeaDraftVariables) => {
      const payload = formValuesToSavePayload(values);

      if (!ideaId) {
        const local = await createLocalIdea({
          authorId: requireAuthorId(),
          isPublished: false,
          title: payload.title ?? undefined,
          description: payload.description ?? undefined,
          stage: payload.stage ?? undefined,
          problemIds: payload.problemIds,
          tagLabels: payload.tagLabels,
          mainImage: values.mainImage ?? null,
          attachments: values.files,
        });
        void drain();
        return localIdeaToIdeaApi(local);
      }

      const local = await updateLocalIdea(
        ideaId,
        toUpdateIdeaInput({ values, payload }),
      );
      void drain();
      return localIdeaToIdeaApi(local);
    },
    onSuccess: () => {
      toast.success('Draft saved', {
        action: {
          label: 'View Drafts',
          onClick: () => {
            void navigate({
              to: ROUTES.profileIdeas,
              search: { tab: 'drafts' },
            });
          },
        },
      });
    },
    onError: error => {
      const message = getApiErrorMessage(error, {
        invalidCredentialsMessage: 'Could not save draft',
      });
      toast.error(message);
    },
  });
}

export function useCreateIdeaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'create'],
    mutationFn: (payload: CreateIdeaPayload) => createIdea(payload),
    onSuccess: idea => {
      invalidateIdeaQueries(queryClient, idea.id);
      toast.success('Idea created');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateIdeaMutation(ideaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'update', ideaId],
    mutationFn: async (payload: UpdateIdeaPayload) => {
      const local = await updateLocalIdea(ideaId, {
        title: payload.title ?? undefined,
        description: payload.description ?? undefined,
        stage: payload.stage ?? undefined,
        problemIds: payload.problemIds,
        tagLabels: payload.tagLabels,
      });
      void drain();
      return localIdeaToIdeaApi(local);
    },
    onSuccess: idea => {
      invalidateIdeaQueries(queryClient, idea.id);
      toast.success('🎉 You earned +15 points', {
        description: 'Progress shared — your updates keep the project moving.',
      });
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteIdeaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'delete'],
    mutationFn: (ideaId: string) => deleteIdea(ideaId),
    onSuccess: (_void, ideaId) => {
      invalidateIdeaQueries(queryClient, undefined, {
        invalidateDashboard: true,
      });
      queryClient.removeQueries({ queryKey: ideaMutationKeys.detail(ideaId) });

      toast.success('Idea deleted');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

type PublishIdeaVariables = {
  values: IdeaCreateFormValues;
  ideaId: string | null;
  ideaStatus: IdeaStatus;
};

export function usePublishIdeaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'publish'],
    mutationFn: async ({
      values,
      ideaId,
      ideaStatus,
    }: PublishIdeaVariables) => {
      const payload = formValuesToSavePayload(values);
      const isPublishedIdea = ideaStatus === IDEA_STATUS.PUBLISHED;

      if (ideaId && isPublishedIdea) {
        const local = await updateLocalIdea(
          ideaId,
          toUpdateIdeaInput({ values, payload }),
        );
        void drain();
        return { idea: localIdeaToIdeaApi(local), action: 'update' as const };
      }

      if (!ideaId) {
        const local = await createLocalIdea({
          authorId: requireAuthorId(),
          isPublished: true,
          title: payload.title ?? undefined,
          description: payload.description ?? undefined,
          stage: payload.stage ?? undefined,
          problemIds: payload.problemIds,
          tagLabels: payload.tagLabels,
          mainImage: values.mainImage ?? null,
          attachments: values.files,
        });
        void drain();
        return { idea: localIdeaToIdeaApi(local), action: 'publish' as const };
      }

      const local = await publishLocalIdea(
        ideaId,
        toUpdateIdeaInput({ values, payload }),
      );
      void drain();
      return { idea: localIdeaToIdeaApi(local), action: 'publish' as const };
    },
    onSuccess: ({ idea, action }) => {
      invalidateIdeaQueries(queryClient, idea.id, {
        invalidateDashboard: true,
      });
      if (action === 'publish') {
        toast.success('🎉 You earned +50 points', {
          description: 'Great work — your new idea moves innovation forward!',
        });
      }
    },
    onError: error => {
      const message = getApiErrorMessage(error);
      toast.error(message);
    },
  });
}

type UploadIdeaMediaVariables = {
  ideaId: string;
  payload: UploadIdeaMediaPayload;
};

export function useUploadIdeaMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'upload-media'],
    mutationFn: ({ ideaId, payload }: UploadIdeaMediaVariables) =>
      uploadIdeaMedia(ideaId, payload),
    onSuccess: (_media, { ideaId }) => {
      invalidateIdeaQueries(queryClient, ideaId);
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

type DeleteIdeaMediaVariables = {
  ideaId: string;
  mediaId: string;
};

export function useDeleteIdeaMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'delete-media'],
    mutationFn: ({ ideaId, mediaId }: DeleteIdeaMediaVariables) =>
      deleteIdeaMedia(ideaId, mediaId),
    onSuccess: (_void, { ideaId }) => {
      invalidateIdeaQueries(queryClient, ideaId);
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

type LinkProblemsVariables = {
  ideaId: string;
  problemIds: string[];
};

export function useLinkProblemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'link-problems'],
    mutationFn: ({ ideaId, problemIds }: LinkProblemsVariables) =>
      linkProblemsToIdea(ideaId, problemIds),
    onSuccess: (_response, { ideaId }) => {
      invalidateIdeaQueries(queryClient, ideaId);
      toast.success('Problems linked successfully');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

type UnlinkProblemVariables = {
  ideaId: string;
  problemId: string;
};

export function useUnlinkProblemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'unlink-problem'],
    mutationFn: ({ ideaId, problemId }: UnlinkProblemVariables) =>
      unlinkProblemFromIdea(ideaId, problemId),
    onSuccess: (_response, { ideaId }) => {
      invalidateIdeaQueries(queryClient, ideaId);
      toast.success('Problem unlinked');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useJoinIdeaMutation(ideaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'join', ideaId],
    mutationFn: () => joinIdea(ideaId),
    onSuccess: () => {
      invalidateIdeaQueries(queryClient, ideaId);
      toast.success('You joined the project');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useLeaveIdeaMutation(ideaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'leave', ideaId],
    mutationFn: () => leaveIdea(ideaId),
    onSuccess: () => {
      invalidateIdeaQueries(queryClient, ideaId, { invalidateDashboard: true });
      toast.success('You left the project');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
