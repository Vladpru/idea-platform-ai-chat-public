import PolycodersLogoWhiteText from '@/assets/svg/polycodersLogoWhiteText.svg';
import { UserNav } from '@/features/auth';
import { HEADER_ACTION_BUTTON_CLASS } from '@/widgets/header/lib/header-action-button-class';
import { Link } from '@tanstack/react-router';
import { Bell, ChevronDown, Search } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { MobileMenu } from './MobileMenu';

const navLinkClass =
  'text-sm font-semibold uppercase tracking-wide text-white/90 transition-colors hover:text-white';

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

        <nav
          className="hidden items-center gap-6 font-normal lg:flex"
          aria-label="Main"
        >
          <Link to="/problems" className={navLinkClass}>
            Problems
          </Link>
          <Link to="/ideas" className={navLinkClass}>
            Ideas
          </Link>
          <Link to="/statistics" className={navLinkClass}>
            Statistics
          </Link>
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
        <Button
          type="button"
          className="bg-brand-accent hover:text-brand-accent border-brand-accent hidden h-9 rounded-sm border px-3 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-transparent sm:h-10 sm:px-4 sm:text-sm lg:inline-flex"
        >
          ADD NEW IDEA
        </Button>

        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                className="bg-brand-accent flex h-9 items-center gap-1 px-3 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:opacity-90 sm:h-10 sm:px-4 sm:text-sm"
              >
                ADD NEW <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="cursor-pointer text-xs font-semibold uppercase">
                Problem
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs font-semibold uppercase">
                Idea
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
