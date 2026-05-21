import PolycodersLogoWhiteText from '@/assets/svg/polycodersLogoWhiteText.svg';
import { UserNav } from '@/features/auth';
import { HEADER_ACTION_BUTTON_CLASS } from '@/widgets/header/lib/header-action-button-class';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { Bell, ChevronDown, Search } from 'lucide-react';
import { clsx } from 'clsx';

import { ROUTES } from '@/shared/config/paths';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { MobileMenu } from './MobileMenu';

function NavLink({ to, label }: { to: string; label: string }) {
  const matchRoute = useMatchRoute();
  const isActive = !!matchRoute({ to });

  return (
    <Link
      to={to}
      className={clsx(
        'relative text-sm tracking-wide uppercase transition-colors hover:text-white',
        isActive
          ? 'after:bg-brand-orange font-bold text-white after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-full after:rounded-full'
          : 'font-normal text-white/90',
      )}
    >
      {label}
    </Link>
  );
}

export function AppHeader() {
  return (
    <header className="bg-brand-dark-blue flex items-center justify-between px-4 py-3 text-white sm:px-10">
      <div className="flex items-center gap-20 xl:gap-35 2xl:gap-45">
        <Link to="/" aria-label="Home">
          <img
            src={PolycodersLogoWhiteText}
            alt="Polycoders Logo"
            className="h-9 w-auto shrink-0 object-contain transition-transform"
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          <NavLink to="/problems" label="Problems" />
          <NavLink to="/ideas" label="Ideas" />
          <NavLink to="/statistics" label="Statistics" />
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          className="text-brand-dark-blue hover:bg-brand-dark-blue hidden h-9 rounded-sm border-white bg-white px-3 text-xs font-bold tracking-wide uppercase transition-colors hover:text-white sm:h-10 sm:px-4 sm:text-sm lg:inline-flex"
        >
          ADD NEW PROBLEM
        </Button>
        <Link
          to={ROUTES.ideasNew}
          className="bg-brand-orange hover:text-brand-orange border-brand-orange hidden h-9 items-center rounded-sm border px-3 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-transparent sm:h-10 sm:px-4 sm:text-sm lg:inline-flex"
        >
          ADD NEW IDEA
        </Link>

        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                className="bg-brand-orange flex h-9 items-center gap-1 px-3 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:opacity-90 sm:h-10 sm:px-4 sm:text-sm"
              >
                ADD NEW <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="cursor-pointer text-xs font-semibold uppercase">
                Problem
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-xs font-semibold uppercase"
                asChild
              >
                <Link to={ROUTES.ideasNew}>Idea</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          type="button"
          className={HEADER_ACTION_BUTTON_CLASS}
          aria-label="Search"
        >
          <Search size={22} strokeWidth={2} />
        </button>

        <button
          type="button"
          className={HEADER_ACTION_BUTTON_CLASS}
          aria-label="Notifications"
        >
          <Bell size={22} strokeWidth={2} />
        </button>

        <div className="hidden lg:block">
          <UserNav triggerClassName={HEADER_ACTION_BUTTON_CLASS} />
        </div>

        <div className="lg:hidden">
          <MobileMenu triggerClassName={HEADER_ACTION_BUTTON_CLASS} />
        </div>
      </div>
    </header>
  );
}
