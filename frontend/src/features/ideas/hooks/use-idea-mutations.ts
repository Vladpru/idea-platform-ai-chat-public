import {
  type CreateIdeaPayload,
  type PublishIdeaPayload,
  type UpdateIdeaPayload,
  type UploadIdeaMediaPayload,
  createIdea,
  createIdeaDraft,
  deleteIdea,
  deleteIdeaMedia,
  publishIdea,
  updateIdea,
  updateIdeaDraft,
  uploadIdeaMedia,
} from '@/features/ideas/api/ideas.api';
import { formValuesToSavePayload } from '@/features/ideas/lib/create-idea-mappers';
import type { IdeaCreateFormValues } from '@/features/ideas/lib/idea-create-schema';
import { useCreateIdeaStore } from '@/features/ideas/store/create-idea.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export const ideaMutationKeys = {
  all: ['ideas'] as const,
  lists: () => [...ideaMutationKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...ideaMutationKeys.lists(), params] as const,
  details: () => [...ideaMutationKeys.all, 'detail'] as const,
  detail: (ideaId: string) => [...ideaMutationKeys.details(), ideaId] as const,
};

function invalidateIdeaQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  ideaId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ideaMutationKeys.lists() });
  if (ideaId) {
    void queryClient.invalidateQueries({
      queryKey: ideaMutationKeys.detail(ideaId),
    });
  }
}

export function useSaveIdeaDraftMutation() {
  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'save-draft'],
    mutationFn: async (values: IdeaCreateFormValues) => {
      const store = useCreateIdeaStore.getState();
      store.syncFromForm(values);

      const payload = formValuesToSavePayload(values);
      const ideaId = store.draft.id;

      if (ideaId) {
        return updateIdeaDraft(ideaId, payload);
      }

      return createIdeaDraft(payload);
    },
    onMutate: () => {
      useCreateIdeaStore.getState().setSaving(true);
      useCreateIdeaStore.getState().setError(null);
    },
    onSuccess: idea => {
      useCreateIdeaStore.getState().applyServerIdea(idea);
      toast.success('Draft saved');
    },
    onError: error => {
      const message = getApiErrorMessage(error, {
        invalidCredentialsMessage: 'Could not save draft',
      });
      useCreateIdeaStore.getState().setError(message);
      toast.error(message);
    },
    onSettled: () => {
      useCreateIdeaStore.getState().setSaving(false);
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
    mutationFn: (payload: UpdateIdeaPayload) => updateIdea(ideaId, payload),
    onSuccess: idea => {
      invalidateIdeaQueries(queryClient, idea.id);
      toast.success('Idea updated');
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
      invalidateIdeaQueries(queryClient);
      queryClient.removeQueries({ queryKey: ideaMutationKeys.detail(ideaId) });

      const store = useCreateIdeaStore.getState();
      if (store.draft.id === ideaId) {
        store.reset();
      }

      toast.success('Idea deleted');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

type PublishIdeaVariables = {
  ideaId: string;
  payload: PublishIdeaPayload;
};

export function usePublishIdeaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'publish'],
    mutationFn: ({ ideaId, payload }: PublishIdeaVariables) =>
      publishIdea(ideaId, payload),
    onMutate: () => {
      useCreateIdeaStore.getState().setSaving(true);
      useCreateIdeaStore.getState().setError(null);
    },
    onSuccess: (idea, { ideaId }) => {
      useCreateIdeaStore.getState().applyServerIdea(idea);
      invalidateIdeaQueries(queryClient, ideaId);
      toast.success('Idea published');
    },
    onError: error => {
      const message = getApiErrorMessage(error);
      useCreateIdeaStore.getState().setError(message);
      toast.error(message);
    },
    onSettled: () => {
      useCreateIdeaStore.getState().setSaving(false);
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
