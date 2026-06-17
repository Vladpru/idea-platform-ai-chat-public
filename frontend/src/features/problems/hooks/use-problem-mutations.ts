import {
  type CreateProblemDraftPayload,
  type CreateProblemPayload,
  type UpdateProblemPayload,
  type UploadProblemAttachmentPayload,
  deleteProblem,
  deleteProblemMedia,
  joinProblem,
  leaveProblem,
  localProblemToProblemForm,
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

import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import {
  createProblem as createLocalProblem,
  updateProblem as updateLocalProblem,
} from '@/shared/offline/repositories';
import { drain } from '@/shared/offline/sync-engine';

function requireAuthorId(): string {
  const authorId = useAuthSessionStore.getState().user?.id;
  if (!authorId) throw new Error('No authenticated user');
  return authorId;
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
    mutationFn: async (payload: CreateProblemPayload) => {
      const local = await createLocalProblem({
        authorId: requireAuthorId(),
        isPublished: payload.isPublished,
        title: payload.title,
        description: payload.description,
        stage: payload.stage,
        valueProposition: payload.valueProposition,
        costBenefit: payload.costBenefit,
        category: payload.category,
        impact: payload.impact,
        ideaIds: payload.ideaIds,
        tagIds: payload.tagIds,
        tagLabels: payload.tagLabels,
      });
      void drain();
      return localProblemToProblemForm(local);
    },
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
        const local = await updateLocalProblem(problemId, {
          ...formValuesToUpdateProblemPayload(values),
          attachments: values.files,
        });
        void drain();
        return localProblemToProblemForm(local);
      }

      const payload = formValuesToCreateProblemPayload(values, true);
      const local = await createLocalProblem({
        authorId: requireAuthorId(),
        isPublished: true,
        title: payload.title,
        description: payload.description,
        stage: payload.stage,
        valueProposition: payload.valueProposition,
        costBenefit: payload.costBenefit,
        category: payload.category,
        impact: payload.impact,
        ideaIds: payload.ideaIds,
        tagIds: payload.tagIds,
        tagLabels: payload.tagLabels,
      });
      void drain();
      return localProblemToProblemForm(local);
    },
    onSuccess: (problem, variables) => {
      invalidateProblemQueries(queryClient, problem.id, {
        invalidateDashboard: true,
      });
      if (variables.problemId) {
        toast.success('🎉 You earned +15 points', {
          description:
            'Progress shared — your updates keep the project moving.',
        });
      } else {
        toast.success('🎉 You earned +50 points', {
          description:
            "Great work — you've identified a new problem that drives innovation.",
        });
      }
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
    networkMode: 'offlineFirst',
    mutationFn: async (payload: CreateProblemDraftPayload) => {
      const local = await createLocalProblem({
        authorId: requireAuthorId(),
        isPublished: false,
        title: payload.title,
        description: payload.description,
      });
      void drain();
      return localProblemToProblemForm(local);
    },
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
    mutationFn: async (payload: UpdateProblemPayload) => {
      const local = await updateLocalProblem(problemId, payload);
      void drain();
      return localProblemToProblemForm(local);
    },
    onSuccess: problem => {
      invalidateProblemQueries(queryClient, problem.id);
      toast.success('🎉 You earned +15 points', {
        description: 'Progress shared — your updates keep the project moving.',
      });
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

export function useJoinProblemMutation(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'join', problemId],
    mutationFn: () => joinProblem(problemId),
    onSuccess: () => {
      invalidateProblemQueries(queryClient, problemId);
      toast.success('🎉 You earned +20 points', {
        description: 'Welcome aboard! Collaboration drives the best solutions.',
      });
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useLeaveProblemMutation(problemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...problemMutationKeys.all, 'leave', problemId],
    mutationFn: () => leaveProblem(problemId),
    onSuccess: () => {
      invalidateProblemQueries(queryClient, problemId, {
        invalidateDashboard: true,
      });
      toast.success('You left the project');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
