import { LogoutConfirmDialog } from '@/features/auth/ui/LogoutConfirmDialog';
import {
  nameInitial,
  useAuthSessionStore,
} from '@/features/auth/model/auth-session-store';
import { ROUTES } from '@/shared/config/paths';
import { Link } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';

interface MobileMenuProps {
  triggerClassName: string;
}

const navLinkClass =
  'block px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-primary rounded-md';

export function MobileMenu({ triggerClassName }: MobileMenuProps) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const user = useAuthSessionStore(s => s.user);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={triggerClassName}
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-brand-gray-200 flex w-[300px] flex-col p-0 sm:w-[400px]"
      >
        <SheetHeader className="border-primary border-b p-4 text-left">
          <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Accordion
            type="multiple"
            defaultValue={['navigation', 'profile']}
            className="flex w-full flex-col gap-2"
          >
            <AccordionItem
              value="navigation"
              className="bg-non-active-background rounded-sm border border-slate-200 px-3"
            >
              <AccordionTrigger className="text-primary px-1 py-2 text-sm font-semibold hover:underline">
                Navigation
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-1 px-1 py-2">
                <Link
                  to="/problems"
                  className={navLinkClass}
                  activeProps={{
                    className: 'bg-active-background text-primary',
                  }}
                >
                  Problems
                </Link>
                <Link
                  to={ROUTES.ideas}
                  search={{ sort: 'newest' }}
                  className={navLinkClass}
                  activeProps={{
                    className: 'bg-active-background text-primary',
                  }}
                >
                  Ideas
                </Link>
                <Link
                  to="/statistics"
                  className={navLinkClass}
                  activeProps={{
                    className: 'bg-active-background text-primary',
                  }}
                >
                  Statistics
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="profile"
              className="bg-non-active-background rounded-sm border border-slate-200 px-3"
            >
              <AccordionTrigger className="text-primary px-1 py-2 text-sm font-semibold hover:underline">
                Profile
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-1 px-1 py-2">
                <div className="mb-4 flex items-center gap-3 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.picture ?? undefined}
                      alt={user?.name || 'User avatar'}
                    />
                    <AvatarFallback className="text-brand-gray-80 bg-slate-200 text-xs font-medium">
                      {nameInitial(user?.name ?? '')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-900">
                    {user?.name || 'Unknown User'}
                  </span>
                </div>

                <Link
                  to="/profile/problems"
                  className={navLinkClass}
                  activeProps={{
                    className: 'bg-active-background text-primary',
                  }}
                >
                  My Problems, Joins & Drafts
                </Link>
                <Link
                  to="/profile/ideas"
                  className={navLinkClass}
                  activeProps={{
                    className: 'bg-active-background text-primary',
                  }}
                >
                  My Ideas, Joins & Drafts
                </Link>
                <Link
                  to="/profile"
                  className={navLinkClass}
                  activeOptions={{ exact: true }}
                  activeProps={{
                    className: 'bg-active-background text-primary',
                  }}
                >
                  Settings
                </Link>

                <button
                  type="button"
                  className="text-brand-accent mt-2 px-3 text-left text-sm font-bold hover:opacity-80"
                  onClick={() => {
                    setLogoutDialogOpen(true);
                  }}
                >
                  Log out
                </button>
                <LogoutConfirmDialog
                  open={logoutDialogOpen}
                  onOpenChange={setLogoutDialogOpen}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="mt-auto flex flex-col gap-3 p-4 pt-0">
          <Button
            variant="outline"
            className="border-primary text-primary w-full text-xs font-bold tracking-wide uppercase"
          >
            ADD NEW PROBLEM
          </Button>
          <Link
            to={ROUTES.ideasNew}
            className="bg-brand-accent inline-flex h-10 w-full items-center justify-center rounded-md text-xs font-bold tracking-wide text-white uppercase hover:opacity-90"
          >
            ADD NEW IDEA
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
