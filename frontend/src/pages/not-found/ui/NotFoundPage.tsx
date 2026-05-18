import {
  primaryBtn,
  sectionTitleClass,
} from '@/features/profile/ui/profile-view-classes';
import { ROUTES } from '@/shared/config/paths';
import { AppHeader } from '@/widgets/header';
import { Link } from '@tanstack/react-router';

import { hasValidSession } from '@/features/auth/model/auth-session-store';
import { cn } from '@/shared/lib/utils';
import { Card } from '@/shared/ui/card';

type NotFoundPageProps = {
  variant?: 'full' | 'content';
};

function NotFoundContent() {
  const isAuthed = hasValidSession();
  const ctaTo = isAuthed ? ROUTES.ideas : ROUTES.login;
  const ctaLabel = isAuthed ? 'Go to ideas' : 'Sign in';

  return (
    <div className="bg-brand-gray-100 dark:bg-background flex flex-1 items-center justify-center py-8 md:min-w-4xl md:px-8">
      <Card
        className={cn(
          'mx-auto w-full border-0 bg-white px-6 py-12 text-center shadow-none',
          'flex flex-col justify-center md:h-[400px] md:max-w-[1680px]',
          'dark:bg-card bg-brand-white md:px-16 md:py-16',
        )}
      >
        <h1 className={cn(sectionTitleClass, 'text-xl md:text-2xl')}>
          Sorry, this content isn&apos;t available
        </h1>
        <p className="dark:text-brand-gray-600 mx-auto mt-4 max-w-lg text-sm leading-relaxed md:text-base">
          The page or item you&apos;re trying to access can&apos;t be displayed
          right now. It may have been moved, deleted, or is temporarily
          unavailable.
        </p>
        <div className="flex w-full justify-center pt-8">
          <Link
            to={ctaTo}
            className={cn(
              primaryBtn,
              'dark:text-brand-gray-900 inline-flex min-w-[160px] items-center justify-center py-2',
            )}
          >
            {ctaLabel}
          </Link>
        </div>
      </Card>
    </div>
  );
}

export function NotFoundPage({ variant = 'full' }: NotFoundPageProps) {
  const isAuthed = hasValidSession();
  const showHeader = variant === 'full' && isAuthed;

  if (showHeader) {
    return (
      <div className="flex min-h-svh flex-col">
        <AppHeader />
        <NotFoundContent />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col',
        variant === 'full' ? 'min-h-svh' : 'min-h-[calc(100dvh-3.75rem)]',
      )}
    >
      <NotFoundContent />
    </div>
  );
}
