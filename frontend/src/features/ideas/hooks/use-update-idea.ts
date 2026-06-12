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
    onSuccess: (_data, values) => {
      invalidateIdeaQueries(queryClient, ideaId);
      if (values.stage === 'completed') {
        toast.success('🎉 You earned +100 points', {
          description: 'You completed an idea — great work!',
        });
      } else {
        toast.success('🎉 You earned +15 points', {
          description: 'Progress shared — your updates keep the project moving.',
        });
      }
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
