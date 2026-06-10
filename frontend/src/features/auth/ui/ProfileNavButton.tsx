import {
  nameInitial,
  useAuthSessionStore,
} from '@/features/auth/model/auth-session-store';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '@/shared/config/paths';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { TriangleDown } from '@/shared/ui/icons/TriangleDown';

import { LogoutConfirmDialog } from './LogoutConfirmDialog';

const linkRowClassName =
  'flex w-full cursor-pointer items-center py-3 px-4 text-base';

export interface UserNavProps {
  triggerClassName: string;
}

export function UserNav({ triggerClassName }: UserNavProps) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const user = useAuthSessionStore(s => s.user);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`group flex items-center gap-1.5 outline-none ${triggerClassName}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.picture ?? undefined}
                alt={user?.name || 'User'}
              />
              <AvatarFallback className="bg-slate-200 text-xs font-medium text-slate-800">
                {nameInitial(user?.name ?? '')}
              </AvatarFallback>
            </Avatar>

            <TriangleDown className="h-3 w-3 text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={16}
          className="border-brand-gray-200 w-62 rounded-sm text-base shadow-lg"
        >
          <DropdownMenuItem asChild className="cursor-pointer p-0 text-sm">
            <Link
              to="/profile/$profileId"
              params={{ profileId: user?.id ?? '' }}
              search={{ tab: 'all' }}
              className={linkRowClassName}
            >
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer p-0 text-sm">
            <Link
              to={ROUTES.profileProblems}
              search={{ tab: 'published' }}
              className={linkRowClassName}
            >
              My Problems, Joins & Drafts
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer p-0 text-sm">
            <Link
              to={ROUTES.profileIdeas}
              search={{ tab: 'published' }}
              className={linkRowClassName}
            >
              My Ideas, Joins & Drafts
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer p-0 text-sm">
            <Link to={ROUTES.liveChats} className={linkRowClassName}>
              <span>Live Chats</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="mx-1" />

          <DropdownMenuItem asChild className="cursor-pointer p-0 text-sm">
            <Link
              to={ROUTES.settings}
              search={{ tab: 'appearance' }}
              className={linkRowClassName}
            >
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="hover:bg-brand-orange/10 flex cursor-pointer items-center px-4 py-3 text-sm"
            onSelect={event => {
              event.preventDefault();
              setLogoutDialogOpen(true);
            }}
          >
            <span className="text-brand-orange">Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
      />
    </>
  );
}
