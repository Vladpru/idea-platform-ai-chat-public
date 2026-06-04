import PolycodersLogoWhiteText from '@/assets/svg/polycodersLogoWhiteText.svg';
import { UserNav } from '@/features/auth';
import { HEADER_ACTION_BUTTON_CLASS } from '@/widgets/header/lib/header-action-button-class';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { Bell, ChevronDown, Search } from 'lucide-react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { AnimatedTabUnderline } from '@/shared/ui/motion';

import { MobileMenu } from './MobileMenu';

function NavLink({
  to,
  label,
  fuzzy = false,
  search,
}: {
  to: string;
  label: string;
  fuzzy?: boolean;
  search?: { sort: 'newest' };
}) {
  const matchRoute = useMatchRoute();
  const isActive = !!matchRoute({ to, fuzzy });

  return (
    <Link
      to={to}
      search={search}
      className={cn(
        'relative text-sm tracking-wide uppercase transition-colors hover:text-white',
        isActive ? 'font-bold text-white' : 'font-normal text-white/90',
      )}
    >
      {label}
      {isActive ? (
        <AnimatedTabUnderline
          layoutId="app-header-nav"
          className="bg-brand-orange -bottom-1.5 h-0.5 rounded-full"
        />
      ) : null}
    </Link>
  );
}

export function AppHeader() {
  return (
    <header className="bg-brand-dark-blue sticky top-0 z-50 flex items-center justify-between px-4 py-3 text-white shadow-sm sm:px-10">
      <div className="flex items-center gap-20 xl:gap-35 2xl:gap-45">
        <Link to="/" aria-label="Home">
          <img
            src={PolycodersLogoWhiteText}
            alt="Polycoders Logo"
            className="h-9 w-auto shrink-0 object-contain transition-transform"
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          <NavLink
            to={ROUTES.problems}
            label="Problems"
            fuzzy
            search={{ sort: 'newest' }}
          />
          <NavLink
            to={ROUTES.ideas}
            label="Ideas"
            fuzzy
            search={{ sort: 'newest' }}
          />
          <NavLink to={ROUTES.statistics} label="Statistics" />
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to={ROUTES.problemsNew}
          className="text-brand-dark-blue hover:bg-brand-dark-blue hidden h-9 items-center rounded-sm border border-white bg-white px-3 text-xs font-bold tracking-wide uppercase transition-colors hover:text-white sm:h-10 sm:px-4 sm:text-sm lg:inline-flex"
        >
          ADD NEW PROBLEM
        </Link>
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

        <Link
          to={ROUTES.search}
          className={HEADER_ACTION_BUTTON_CLASS}
          aria-label="Search"
          search={{ q: '', t: 'ideas' }}
        >
          <Search size={22} strokeWidth={2} />
        </Link>

        <button
          type="button"
          className={HEADER_ACTION_BUTTON_CLASS}
          aria-label="Notifications"
        >
          <Bell size={22} strokeWidth={2} />
        </button>

        <ThemeToggle className="border-0 text-white hover:bg-white/10" />

        <div className="w-min-[] hidden lg:block">
          <UserNav triggerClassName=" transition-opacity cursor-pointer" />
        </div>

        <div className="lg:hidden">
          <MobileMenu triggerClassName={HEADER_ACTION_BUTTON_CLASS} />
        </div>
      </div>
    </header>
  );
}
