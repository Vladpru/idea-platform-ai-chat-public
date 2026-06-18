import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

import {
  type ConflictResolution,
  type SyncEntity,
  discardFailed,
  resolveConflict,
  retrySync,
} from './repositories';
import { drain } from './sync-engine';

export type { SyncEntity, ConflictResolution };

function invalidateEntity(
  queryClient: ReturnType<typeof useQueryClient>,
  entity: SyncEntity,
): void {
  void queryClient.invalidateQueries({
    queryKey: [entity === 'idea' ? 'ideas' : 'problems'],
  });
}

export function useResolveConflictMutation(entity: SyncEntity) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sync', entity, 'resolve-conflict'],
    mutationFn: async (vars: {
      localId: string;
      resolution: ConflictResolution;
    }) => {
      await resolveConflict(entity, vars.localId, vars.resolution);
      if (vars.resolution === 'force') void drain();
    },
    onSuccess: (_data, { resolution }) => {
      invalidateEntity(queryClient, entity);
      toast.success(
        resolution === 'force'
          ? 'Re-saving your changes…'
          : 'Reverted to the server version',
      );
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useRetrySyncMutation(entity: SyncEntity) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sync', entity, 'retry'],
    mutationFn: async (vars: { localId: string }) => {
      await retrySync(entity, vars.localId);
      void drain();
    },
    onSuccess: () => {
      invalidateEntity(queryClient, entity);
      toast.success('Retrying sync…');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDiscardFailedMutation(entity: SyncEntity) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sync', entity, 'discard-failed'],
    mutationFn: (vars: { localId: string }) =>
      discardFailed(entity, vars.localId),
    onSuccess: () => {
      invalidateEntity(queryClient, entity);
      toast.success('Discarded the failed changes');
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
