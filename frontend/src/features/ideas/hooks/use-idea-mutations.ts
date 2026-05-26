import {
  type CreateIdeaPayload,
  type UpdateIdeaPayload,
  type UploadIdeaMediaPayload,
  createIdea,
  createIdeaDraft,
  createPublishedIdea,
  deleteIdea,
  deleteIdeaMedia,
  fetchIdeaById,
  joinIdea,
  leaveIdea,
  linkProblemsToIdea,
  unlinkProblemFromIdea,
  publishIdea,
  updatePublishedIdea,
  updateIdea,
  updateIdeaDraft,
  uploadIdeaMainImage,
  uploadIdeaMedia,
} from '@/features/ideas/api/ideas.api';
import {
  type IdeaCreateFormValues,
  formValuesToSavePayload,
} from '@/features/ideas/lib/create-idea';
import { useCreateIdeaStore } from '@/features/ideas/store/create-idea.store';
import { IDEA_STATUS } from '@/features/ideas/model/idea.types';
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

      const idea = ideaId
        ? await updateIdeaDraft(ideaId, payload)
        : await createIdeaDraft(payload);

      if (values.mainImage) {
        await uploadIdeaMainImage(idea.id, values.mainImage);
      }

      if (values.files && values.files.length > 0) {
        await Promise.all(
          values.files.map(file =>
            uploadIdeaMedia(idea.id, { file, kind: 'attachment' }),
          ),
        );
      }

      return fetchIdeaById(idea.id);
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

type PublishIdeaVariables = IdeaCreateFormValues;

async function uploadIdeaFiles(ideaId: string, values: IdeaCreateFormValues) {
  if (values.mainImage) {
    await uploadIdeaMainImage(ideaId, values.mainImage);
  }

  if (values.files && values.files.length > 0) {
    await Promise.all(
      values.files.map(file =>
        uploadIdeaMedia(ideaId, { file, kind: 'attachment' }),
      ),
    );
  }
}

export function usePublishIdeaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'publish'],
    mutationFn: async (values: PublishIdeaVariables) => {
      const store = useCreateIdeaStore.getState();
      store.syncFromForm(values);

      const payload = formValuesToSavePayload(values);
      const ideaId = store.draft.id;
      const isPublishedIdea = store.draft.status === IDEA_STATUS.PUBLISHED;

      if (ideaId && isPublishedIdea) {
        await updatePublishedIdea(ideaId, payload);
        await uploadIdeaFiles(ideaId, values);
        return {
          idea: await fetchIdeaById(ideaId),
          action: 'update' as const,
        };
      }

      let idea: Awaited<ReturnType<typeof fetchIdeaById>>;

      if (ideaId) {
        await updateIdeaDraft(ideaId, payload);
        await uploadIdeaFiles(ideaId, values);
        idea = await publishIdea(ideaId);
      } else {
        idea = await createPublishedIdea(payload);
        await uploadIdeaFiles(idea.id, values);
      }

      return {
        idea: await fetchIdeaById(idea.id),
        action: 'publish' as const,
      };
    },
    onMutate: () => {
      useCreateIdeaStore.getState().setSaving(true);
      useCreateIdeaStore.getState().setError(null);
    },
    onSuccess: ({ idea, action }) => {
      useCreateIdeaStore.getState().applyServerIdea(idea);
      invalidateIdeaQueries(queryClient, idea.id);
      toast.success(action === 'update' ? 'Idea updated' : 'Idea published');
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
      invalidateIdeaQueries(queryClient, ideaId);
      toast.success('You left the project');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
