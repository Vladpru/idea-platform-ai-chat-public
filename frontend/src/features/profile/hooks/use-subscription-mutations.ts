import {
  subscribeToUser,
  unsubscribeFromUser,
  type UserPublicProfile,
} from '@/features/profile/api/profile.api';
import { userProfileKeys } from '@/features/profile/hooks/use-user-profile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSubscribeMutation(profileUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscribeToUser(profileUserId),
    onSuccess: () => {
      queryClient.setQueryData<UserPublicProfile>(
        userProfileKeys.detail(profileUserId),
        current => {
          if (!current) return current;
          return {
            ...current,
            isSubscribed: true,
            subscriberCount: current.subscriberCount + 1,
          };
        },
      );
      toast.success('Subscribed successfully');
    },
    onError: () => {
      toast.error('Failed to subscribe. Please try again.');
    },
  });
}

export function useUnsubscribeMutation(profileUserId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unsubscribeFromUser(profileUserId),
    onSuccess: () => {
      queryClient.setQueryData<UserPublicProfile>(
        userProfileKeys.detail(profileUserId),
        current => {
          if (!current) return current;
          return {
            ...current,
            isSubscribed: false,
            subscriberCount: Math.max(0, current.subscriberCount - 1),
          };
        },
      );
      toast.success('Unsubscribed successfully');
    },
    onError: () => {
      toast.error('Failed to unsubscribe. Please try again.');
    },
  });
}
