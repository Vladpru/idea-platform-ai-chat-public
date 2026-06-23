import { NotificationDropdown } from '@/features/notifications/ui/NotificationDropdown';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-notifications';
import { HEADER_ACTION_BUTTON_CLASS } from '@/widgets/header/lib/header-action-button-class';
import { useLocation } from '@tanstack/react-router';
import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 639px)');
  const { data } = useUnreadNotificationCount();
  const unreadCount = data?.count ?? 0;

  useEffect(() => {
    setOpen(false);
    document.body.style.pointerEvents = '';
  }, [location.pathname]);

  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, isMobile]);

  const triggerButton = (
    <button
      type="button"
      className={cn(HEADER_ACTION_BUTTON_CLASS, 'relative')}
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : 'Notifications'
      }
      aria-expanded={open}
      onClick={isMobile ? () => setOpen(prev => !prev) : undefined}
    >
      <Bell size={22} strokeWidth={2} />
      {unreadCount > 0 ? (
        <span className="bg-brand-orange absolute top-1.5 right-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </button>
  );

  if (isMobile) {
    return (
      <>
        {triggerButton}
        {open ? (
          <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
            <div
              className="fixed inset-0 bg-black/40 transition-opacity"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <div className="animate-in slide-in-from-bottom-full bg-card relative flex h-[80vh] w-full flex-col overflow-hidden rounded-t-lg shadow-xl duration-300">
              <div className="border-border flex shrink-0 items-center justify-between border-b px-5 py-4">
                <h2 className="text-foreground text-xl font-bold">
                  Notifications
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-foreground rounded-full p-1 transition-colors hover:bg-gray-100"
                  aria-label="Close notifications"
                >
                  <X className="size-6" />
                </button>
              </div>

              <NotificationDropdown
                variant="sheet"
                enabled={open}
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
        onCloseAutoFocus={event => event.preventDefault()}
      >
        <NotificationDropdown enabled={open} onClose={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
