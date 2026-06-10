import {
  fetchCurrentUser,
  type CurrentUser,
} from '@/features/profile/api/profile.api';
import { updateNotificationPreferences } from '@/features/settings/api/notification-preferences.api';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  type NotificationPreferenceKey,
  type NotificationPreferencesMap,
  type UpdateNotificationPreferencesPayload,
} from '@/features/settings/model/notification-preferences.types';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

export const currentUserQueryRootKey = ['users', 'me'] as const;

export function currentUserQueryKey(userId: string) {
  return [...currentUserQueryRootKey, userId] as const;
}

function getActiveCurrentUserQueryKey(): ReturnType<
  typeof currentUserQueryKey
> | null {
  const userId = useAuthSessionStore.getState().user?.id;
  return userId ? currentUserQueryKey(userId) : null;
}

type UpdatePreferencesContext = {
  previousUser?: CurrentUser;
  previousPreferences?: NotificationPreferencesMap;
  queryKey?: ReturnType<typeof currentUserQueryKey>;
};

export function useCurrentUserQuery(options?: { enabled?: boolean }) {
  const sessionUserId = useAuthSessionStore(s => s.user?.id);

  return useQuery({
    queryKey: sessionUserId
      ? currentUserQueryKey(sessionUserId)
      : currentUserQueryRootKey,
    queryFn: fetchCurrentUser,
    enabled: (options?.enabled ?? true) && Boolean(sessionUserId),
    staleTime: 60_000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (payload: UpdateNotificationPreferencesPayload) => {
      const queryKey = getActiveCurrentUserQueryKey();
      if (!queryKey) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey });

      const previousUser = queryClient.getQueryData<CurrentUser>(queryKey);
      const previousPreferences =
        previousUser?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;

      if (previousUser) {
        queryClient.setQueryData<CurrentUser>(queryKey, {
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
        queryKey,
      } satisfies UpdatePreferencesContext & {
        queryKey?: ReturnType<typeof currentUserQueryKey>;
      };
    },
    onError: (_error, _payload, context) => {
      if (
        context?.previousUser &&
        context.previousPreferences &&
        context.queryKey
      ) {
        queryClient.setQueryData<CurrentUser>(context.queryKey, {
          ...context.previousUser,
          notificationPreferences: context.previousPreferences,
        });
      }

      toast.error('Could not update notification settings');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: currentUserQueryRootKey,
      });
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
