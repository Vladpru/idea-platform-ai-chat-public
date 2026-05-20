import { useDeleteIdeaMutation } from '@/features/ideas/hooks/use-idea-mutations';
import { useCallback } from 'react';

type DeleteIdeaHandlers = {
  onSuccess?: () => void;
};

export function useDeleteIdea() {
  const mutation = useDeleteIdeaMutation();

  const deleteIdea = useCallback(
    (ideaId: string, handlers?: DeleteIdeaHandlers) => {
      mutation.mutate(ideaId, {
        onSuccess: () => {
          handlers?.onSuccess?.();
        },
      });
    },
    [mutation],
  );

  return {
    deleteIdea,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
