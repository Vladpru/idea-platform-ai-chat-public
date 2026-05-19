import {
  nameInitial,
  useAuthSessionStore,
} from '@/features/auth/model/auth-session-store';
import { Link } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

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
            className={triggerClassName}
            aria-label="Account menu"
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
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={5}
          className="w-50 text-base"
        >
          <DropdownMenuItem asChild className="cursor-pointer p-0 text-sm">
            <Link to="/profile" className={linkRowClassName}>
              <User className="mr-3 h-5 w-5 shrink-0" aria-hidden />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="flex cursor-pointer items-center px-4 py-3 text-sm"
            onSelect={event => {
              event.preventDefault();
              setLogoutDialogOpen(true);
            }}
          >
            <LogOut className="mr-3 h-5 w-5 shrink-0" aria-hidden />
            <span>Log out</span>
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
