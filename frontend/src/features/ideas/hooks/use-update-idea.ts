import { saveEditedIdea } from '@/features/ideas/lib/edit-idea/save';
import type { IdeaEditFormValues } from '@/features/ideas/lib/edit-idea/schema';
import {
  ideaMutationKeys,
  invalidateIdeaQueries,
} from '@/features/ideas/hooks/use-idea-mutations';
import type { IdeaStatus } from '@/features/ideas/model/idea.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export function useUpdateIdea(ideaId: string, status: IdeaStatus) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...ideaMutationKeys.all, 'update', ideaId, status],
    mutationFn: (values: IdeaEditFormValues) =>
      saveEditedIdea(ideaId, status, values),
    onSuccess: () => {
      invalidateIdeaQueries(queryClient, ideaId);
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
