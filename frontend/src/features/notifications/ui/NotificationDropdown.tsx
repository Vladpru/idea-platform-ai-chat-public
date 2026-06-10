import { groupNotificationsByDate } from '@/features/notifications/lib/group-notifications-by-date';
import { ROUTES } from '@/shared/config/paths';
import { Link } from '@tanstack/react-router';
import { MoreVertical } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { AnimatedTabUnderline } from '@/shared/ui/motion';
import { ScrollArea } from '@/shared/ui/scroll-area';

import type { NotificationDto } from '../api/notifications.types';
import {
  useDeleteAllNotificationsMutation,
  useMarkAllNotificationsReadMutation,
  useNotifications,
  useUnreadNotificationCount,
} from '../hooks/use-notifications';
import { NotificationItem } from './NotificationItem';

type NotificationTab = 'all' | 'unread';

const NOTIFICATION_TAB_UNDERLINE_LAYOUT_ID = 'notification-dropdown-tabs';

type NotificationDropdownProps = {
  onClose?: () => void;
  variant?: 'popover' | 'sheet';
  enabled?: boolean;
};

type NotificationTabButtonProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
};

function NotificationTabButton({
  label,
  isActive,
  onClick,
  badge,
}: NotificationTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-full items-center gap-2 text-xs tracking-wide uppercase transition-colors',
        isActive
          ? 'text-foreground font-bold'
          : 'text-muted-foreground hover:text-foreground font-normal',
      )}
    >
      {label}
      {badge !== undefined ? (
        <span
          className={cn(
            'inline-flex min-h-5 min-w-5 items-center justify-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            badge > 0
              ? 'bg-muted text-muted-foreground'
              : 'invisible',
          )}
          aria-hidden={badge === 0}
        >
          {badge > 0 ? badge : 0}
        </span>
      ) : null}
      {isActive ? (
        <AnimatedTabUnderline
          layoutId={NOTIFICATION_TAB_UNDERLINE_LAYOUT_ID}
          className="bg-brand-orange bottom-0 h-1 rounded-full"
        />
      ) : null}
    </button>
  );
}

export function NotificationDropdown({
  onClose,
  variant = 'popover',
  enabled = true,
}: NotificationDropdownProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotifications({ enabled });
  const { data: unreadData } = useUnreadNotificationCount();
  const markAllAsRead = useMarkAllNotificationsReadMutation();
  const deleteAll = useDeleteAllNotificationsMutation();
  const unreadCount = unreadData?.count ?? 0;
  const listMutationsPending = markAllAsRead.isPending || deleteAll.isPending;

  const allNotifications = useMemo(
    () => data?.pages.flatMap(page => page.data) ?? [],
    [data?.pages],
  );

  const visibleNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return allNotifications.filter(
        notification => notification.readAt === null,
      );
    }

    return allNotifications;
  }, [activeTab, allNotifications]);

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(visibleNotifications),
    [visibleNotifications],
  );

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleClearAll = () => {
    deleteAll.mutate();
  };

  const emptyStateMinHeight =
    variant === 'sheet' ? 'min-h-0 flex-1' : 'min-h-[400px]';

  return (
    <div
      className={cn(
        'bg-card text-card-foreground flex flex-col overflow-hidden',
        variant === 'sheet'
          ? 'min-h-0 flex-1 w-full'
          : 'h-[590px] w-[480px] max-w-[100vw] rounded-md border shadow-lg',
      )}
    >
      <div className="border-border h-12 shrink-0 border-b px-4">
        <div className="flex h-full items-center justify-between">
          <nav
            className="relative z-10 flex h-full items-stretch gap-6"
            aria-label="Notification filters"
          >
            <NotificationTabButton
              label="All"
              isActive={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
            />
            <NotificationTabButton
              label="Unread"
              isActive={activeTab === 'unread'}
              onClick={() => setActiveTab('unread')}
              badge={unreadCount}
            />
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground border-border focus-visible:ring-ring/50 inline-flex size-7 shrink-0 items-center justify-center rounded-sm border transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Notification actions"
              >
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={handleMarkAllAsRead}
                disabled={listMutationsPending || unreadCount === 0}
              >
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleClearAll}
                disabled={listMutationsPending || allNotifications.length === 0}
                className="text-brand-orange focus:text-brand-orange"
              >
                Clear all
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to={ROUTES.settings}
                  search={{ tab: 'notifications' }}
                  onClick={onClose}
                >
                  Notifications settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {isLoading ? (
          <div
            className={cn(
              'flex h-full items-center justify-center p-4',
              emptyStateMinHeight,
            )}
          >
            <p className="text-muted-foreground text-sm">
              Loading notifications...
            </p>
          </div>
        ) : null}

        {isError ? (
          <div
            className={cn(
              'flex h-full items-center justify-center p-4',
              emptyStateMinHeight,
            )}
          >
            <p className="text-muted-foreground text-sm">
              Could not load notifications.
            </p>
          </div>
        ) : null}

        {!isLoading && !isError && visibleNotifications.length === 0 ? (
          <div
            className={cn(
              'flex h-full items-center justify-center p-4',
              emptyStateMinHeight,
            )}
          >
            <p className="text-muted-foreground text-sm">
              {activeTab === 'unread'
                ? 'No unread notifications.'
                : 'No notifications yet.'}
            </p>
          </div>
        ) : null}

        {!isLoading && !isError && visibleNotifications.length > 0
          ? groupedNotifications.map(group => (
              <section key={group.key}>
                <h3 className="text-muted-foreground px-4 py-3 text-xs font-medium tracking-wide">
                  {group.label}
                </h3>
                <div className="divide-border divide-y">
                  {group.items.map((notification: NotificationDto) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onNavigate={onClose}
                      actionsDisabled={listMutationsPending}
                    />
                  ))}
                </div>
              </section>
            ))
          : null}

        {hasNextPage && activeTab === 'all' ? (
          <div className="flex justify-center p-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetchingNextPage || listMutationsPending}
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </ScrollArea>

      {variant === 'sheet' ? (
        <div className="bg-card shrink-0 pt-1 pb-2">
          <div className="bg-brand-black mx-auto h-1.5 w-16 rounded-full" />
        </div>
      ) : null}
    </div>
  );
}
