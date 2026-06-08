import { fetchCurrentUser, type UserPublic } from '@/features/profile/api/profile.api';
import { updateNotificationPreferences } from '@/features/settings/api/notification-preferences.api';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  type NotificationPreferenceKey,
  type NotificationPreferencesMap,
  type UpdateNotificationPreferencesPayload,
} from '@/features/settings/model/notification-preferences.types';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

export const currentUserQueryKey = ['users', 'me'] as const;

type UpdatePreferencesContext = {
  previousUser?: UserPublic;
  previousPreferences?: NotificationPreferencesMap;
};

export function useCurrentUserQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (payload: UpdateNotificationPreferencesPayload) => {
      await queryClient.cancelQueries({ queryKey: currentUserQueryKey });

      const previousUser = queryClient.getQueryData<UserPublic>(
        currentUserQueryKey,
      );
      const previousPreferences =
        previousUser?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;

      if (previousUser) {
        queryClient.setQueryData<UserPublic>(currentUserQueryKey, {
          ...previousUser,
          notificationPreferences: mergeNotificationPreferences(
            previousPreferences,
            payload,
          ),
        });
      }

      return {
        previousUser,
        previousPreferences,
      } satisfies UpdatePreferencesContext;
    },
    onError: (_error, _payload, context) => {
      if (context?.previousUser && context.previousPreferences) {
        queryClient.setQueryData<UserPublic>(currentUserQueryKey, {
          ...context.previousUser,
          notificationPreferences: context.previousPreferences,
        });
      }

      toast.error('Could not update notification settings');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}

export function useNotificationPreferenceChannels() {
  const { data: user, isLoading } = useCurrentUserQuery();

  return {
    channels: user?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
    isLoading,
  };
}

export function useSetNotificationChannelMutation() {
  const updatePreferences = useUpdateNotificationPreferences();

  return {
    ...updatePreferences,
    mutateChannel: (
      key: NotificationPreferenceKey,
      channel: 'inApp' | 'email',
      value: boolean,
    ) => {
      updatePreferences.mutate({
        [key]: { [channel]: value },
      });
    },
  };
}
