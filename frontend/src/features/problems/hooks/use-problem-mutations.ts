import {
  type CreateProblemPayload,
  type UpdateProblemPayload,
  type UploadProblemAttachmentPayload,
  createProblem,
  createProblemDraft,
  deleteProblem,
  deleteProblemMedia,
  updateProblem,
  uploadProblemAttachment,
} from '@/features/problems/api/problems.api';
import {
  type SubmitProblemFormValues,
  formValuesToCreateProblemPayload,
  formValuesToUpdateProblemPayload,
} from '@/features/problems/lib/submit-problem';
import { myProblemsDashboardKeys } from '@/features/profile/hooks/use-my-problems-dashboard';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';

async function uploadProblemFiles(
  problemId: string,
  files: File[] | undefined,
) {
  if (!files?.length) return;
  await Promise.all(
    files.map(file => uploadProblemAttachment(problemId, { file })),
  );
}

export const problemMutationKeys = {
  all: ['problems'] as const,
  lists: () => [...problemMutationKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...problemMutationKeys.lists(), params] as const,
  mine: (params?: Record<string, unknown>) =>
    [...problemMutationKeys.all, 'mine', params] as const,
  details: () => [...problemMutationKeys.all, 'detail'] as const,
  detail: (problemId: string) =>
    [...problemMutationKeys.details(), problemId] as const,
  suggestedIdeas: (params: Record<string, unknown>) =>
    [...problemMutationKeys.all, 'suggested-ideas', params] as const,
  suggestedTags: (params: Record<string, unknown>) =>
    [...problemMutationKeys.all, 'suggested-tags', params] as const,
};

function invalidateProblemQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  problemId?: string,
  { invalidateDashboard = false }: { invalidateDashboard?: boolean } = {},
) {
  void queryClient.invalidateQueries({ queryKey: problemMutationKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: problemMutationKeys.all });
  if (problemId) {
    void queryClient.invalidateQueries({
      queryKey: problemMutationKeys.detail(problemId),
    });
  }
  if (invalidateDashboard) {
    void queryClient.invalidateQueries({
      queryKey: myProblemsDashboardKeys.all,
    });
  }
}

export function useCreateProblemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'create'],
    mutationFn: (payload: CreateProblemPayload) => createProblem(payload),
    onSuccess: (problem, variables) => {
      invalidateProblemQueries(queryClient, problem.id);
      toast.success(
        variables.isPublished ? 'Problem published' : 'Problem created',
      );
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export type PublishProblemVariables = {
  values: SubmitProblemFormValues;
  problemId?: string;
};

export function usePublishProblemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'publish'],
    mutationFn: async ({ values, problemId }: PublishProblemVariables) => {
      if (problemId) {
        const problem = await updateProblem(
          problemId,
          formValuesToUpdateProblemPayload(values),
        );
        await uploadProblemFiles(problemId, values.files);
        return problem;
      }

      const payload = formValuesToCreateProblemPayload(values, true);
      const problem = await createProblem(payload);
      await uploadProblemFiles(problem.id, values.files);
      return problem;
    },
    onSuccess: (problem, variables) => {
      invalidateProblemQueries(queryClient, problem.id, {
        invalidateDashboard: true,
      });
      toast.success(
        variables.problemId ? 'Problem updated' : 'Problem published',
      );
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useCreateProblemDraftMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'create-draft'],
    mutationFn: createProblemDraft,
    onSuccess: problem => {
      invalidateProblemQueries(queryClient, problem.id);
      toast.success('Draft saved', {
        action: {
          label: 'View Drafts',
          onClick: () => {
            void navigate({
              to: ROUTES.profileProblems,
              search: { tab: 'drafts' },
            });
          },
        },
      });
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateProblemMutation(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'update', problemId],
    mutationFn: (payload: UpdateProblemPayload) =>
      updateProblem(problemId, payload),
    onSuccess: problem => {
      invalidateProblemQueries(queryClient, problem.id);
      toast.success('Problem updated');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteProblemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'delete'],
    mutationFn: (problemId: string) => deleteProblem(problemId),
    onSuccess: (_void, problemId) => {
      invalidateProblemQueries(queryClient, problemId, {
        invalidateDashboard: true,
      });
      toast.success('Problem deleted');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUploadProblemAttachmentMutation(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'upload-media', problemId],
    mutationFn: (payload: UploadProblemAttachmentPayload) =>
      uploadProblemAttachment(problemId, payload),
    onSuccess: problem => {
      invalidateProblemQueries(queryClient, problem.id);
      toast.success('Attachment uploaded');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteProblemMediaMutation(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'delete-media', problemId],
    mutationFn: (mediaId: string) => deleteProblemMedia(problemId, mediaId),
    onSuccess: () => {
      invalidateProblemQueries(queryClient, problemId);
      toast.success('Attachment removed');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
