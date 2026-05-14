import PolycodersLogo from "@/assets/svg/polycodersLogo.svg";
import { Link } from "@tanstack/react-router";
import { UserNav } from "@/features/auth";
import { Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { HEADER_ACTION_BUTTON_CLASS } from "@/widgets/header/lib/header-action-button-class";
import { MobileMenu } from "./MobileMenu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

const navLinkClass =
  "text-sm font-semibold uppercase tracking-wide text-white/90 transition-colors hover:text-white";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 sm:px-6 bg-primary text-white">
      <div className="flex items-center gap-6 sm:gap-10">
        <Link to="/" aria-label="Home">
          <img
            src={PolycodersLogo}
            alt="Polycoders Logo"
            className="h-8 w-auto shrink-0 object-contain transition-transform hover:scale-105"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6" aria-label="Main">
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
          className="hidden lg:inline-flex h-9 border-white bg-transparent px-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10 sm:h-10 sm:px-4 sm:text-sm"
        >
          ADD NEW PROBLEM
        </Button>
        <Button
          type="button"
          className="hidden lg:inline-flex h-9 bg-brand-accent px-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-foreground/95 sm:h-10 sm:px-4 sm:text-sm"
        >
          ADD NEW IDEA
        </Button>

        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                className="flex items-center gap-1 h-9 bg-brand-accent px-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:opacity-90 sm:h-10 sm:px-4 sm:text-sm"
              >
                ADD NEW <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="cursor-pointer font-semibold uppercase text-xs">
                Problem
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer font-semibold uppercase text-xs">
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
