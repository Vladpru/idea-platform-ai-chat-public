import {
  deleteAllNotifications,
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/features/notifications/api/notifications.api';
import type {
  PaginatedNotificationsResponse,
  UnreadCountResponse,
} from '@/features/notifications/api/notifications.types';
import { NOTIFICATIONS_LIST_LIMIT } from '@/features/notifications/lib/notification-list.constants';
import { notificationQueryKeys } from '@/features/notifications/lib/notification-query-keys';
import {
  emptyNotificationListSnapshot,
  findNotificationInInfiniteData,
  mapNotificationListPages,
  type NotificationListSnapshot,
} from '@/features/notifications/lib/sync-notification-mutation-cache';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

type NotificationMutationContext = {
  previousList?: NotificationListSnapshot;
  previousUnreadCount?: UnreadCountResponse;
};

export function useNotifications(options?: { enabled?: boolean }) {
  const accessToken = useAuthSessionStore(state => state.accessToken);

  return useInfiniteQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: ({ pageParam }) =>
      fetchNotifications({
        cursor: pageParam,
        limit: NOTIFICATIONS_LIST_LIMIT,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage =>
      lastPage.meta.hasNextPage
        ? (lastPage.meta.nextCursor ?? undefined)
        : undefined,
    enabled: (options?.enabled ?? true) && Boolean(accessToken),
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  const accessToken = useAuthSessionStore(state => state.accessToken);

  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      const previousList = queryClient.getQueryData<
        InfiniteData<PaginatedNotificationsResponse>
      >(notificationQueryKeys.list());
      const previousUnreadCount = queryClient.getQueryData<UnreadCountResponse>(
        notificationQueryKeys.unreadCount(),
      );

      const target = findNotificationInInfiniteData(
        previousList,
        notificationId,
      );
      const wasUnread = target?.readAt === null;

      if (previousList && target && wasUnread) {
        queryClient.setQueryData<InfiniteData<PaginatedNotificationsResponse>>(
          notificationQueryKeys.list(),
          mapNotificationListPages(previousList, page => ({
            ...page,
            data: page.data.map(notification =>
              notification.id === notificationId
                ? { ...notification, readAt: new Date().toISOString() }
                : notification,
            ),
          })),
        );
      }

      if (previousUnreadCount && wasUnread) {
        queryClient.setQueryData<UnreadCountResponse>(
          notificationQueryKeys.unreadCount(),
          {
            count: Math.max(0, previousUnreadCount.count - 1),
          },
        );
      }

      return {
        previousList,
        previousUnreadCount,
      } satisfies NotificationMutationContext;
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          notificationQueryKeys.list(),
          context.previousList,
        );
      }

      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(),
          context.previousUnreadCount,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      const previousList = queryClient.getQueryData<
        InfiniteData<PaginatedNotificationsResponse>
      >(notificationQueryKeys.list());
      const previousUnreadCount = queryClient.getQueryData<UnreadCountResponse>(
        notificationQueryKeys.unreadCount(),
      );

      if (previousList) {
        queryClient.setQueryData<InfiniteData<PaginatedNotificationsResponse>>(
          notificationQueryKeys.list(),
          mapNotificationListPages(previousList, page => ({
            ...page,
            data: page.data.map(notification => ({
              ...notification,
              readAt: notification.readAt ?? new Date().toISOString(),
            })),
          })),
        );
      }

      queryClient.setQueryData<UnreadCountResponse>(
        notificationQueryKeys.unreadCount(),
        { count: 0 },
      );

      return {
        previousList,
        previousUnreadCount,
      } satisfies NotificationMutationContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          notificationQueryKeys.list(),
          context.previousList,
        );
      }

      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(),
          context.previousUnreadCount,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useDeleteAllNotificationsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllNotifications,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      const previousList = queryClient.getQueryData<
        InfiniteData<PaginatedNotificationsResponse>
      >(notificationQueryKeys.list());
      const previousUnreadCount = queryClient.getQueryData<UnreadCountResponse>(
        notificationQueryKeys.unreadCount(),
      );

      queryClient.setQueryData<InfiniteData<PaginatedNotificationsResponse>>(
        notificationQueryKeys.list(),
        emptyNotificationListSnapshot(
          previousList?.pages[0]?.meta.limit ?? NOTIFICATIONS_LIST_LIMIT,
        ),
      );

      queryClient.setQueryData<UnreadCountResponse>(
        notificationQueryKeys.unreadCount(),
        { count: 0 },
      );

      return {
        previousList,
        previousUnreadCount,
      } satisfies NotificationMutationContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          notificationQueryKeys.list(),
          context.previousList,
        );
      }

      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(),
          context.previousUnreadCount,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({
        queryKey: notificationQueryKeys.all,
      });

      const previousList = queryClient.getQueryData<
        InfiniteData<PaginatedNotificationsResponse>
      >(notificationQueryKeys.list());
      const previousUnreadCount = queryClient.getQueryData<UnreadCountResponse>(
        notificationQueryKeys.unreadCount(),
      );

      const target = findNotificationInInfiniteData(
        previousList,
        notificationId,
      );
      const wasUnread = target?.readAt === null;

      if (previousList) {
        queryClient.setQueryData<InfiniteData<PaginatedNotificationsResponse>>(
          notificationQueryKeys.list(),
          mapNotificationListPages(previousList, page => ({
            ...page,
            data: page.data.filter(
              notification => notification.id !== notificationId,
            ),
          })),
        );
      }

      if (previousUnreadCount && wasUnread) {
        queryClient.setQueryData<UnreadCountResponse>(
          notificationQueryKeys.unreadCount(),
          {
            count: Math.max(0, previousUnreadCount.count - 1),
          },
        );
      }

      return {
        previousList,
        previousUnreadCount,
      } satisfies NotificationMutationContext;
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          notificationQueryKeys.list(),
          context.previousList,
        );
      }

      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationQueryKeys.unreadCount(),
          context.previousUnreadCount,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}
