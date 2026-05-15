import {
  primaryBtn,
  sectionTitleClass,
} from '@/features/profile/ui/profile-view-classes';
import { ROUTES } from '@/routes/paths';
import { AppHeader } from '@/widgets/header';
import { Link } from '@tanstack/react-router';

import { hasStoredAuthToken } from '@/shared/lib/auth-token';
import { cn } from '@/shared/lib/utils';
import { Card } from '@/shared/ui/card';

type NotFoundPageProps = {
  variant?: 'full' | 'content';
};

function NotFoundContent() {
  const isAuthed = hasStoredAuthToken();
  const ctaTo = isAuthed ? ROUTES.ideas : ROUTES.login;
  const ctaLabel = isAuthed ? 'Go to ideas' : 'Sign in';

  return (
    <div className="bg-brand-neutral dark:bg-background flex flex-1 items-center justify-center py-8 md:min-w-4xl md:px-8">
      <Card
        className={cn(
          'mx-auto w-full border-0 bg-white px-6 py-12 text-center shadow-none',
          'flex flex-col justify-center md:h-[400px] md:max-w-[1680px]',
          'bg-brand-white dark:bg-card md:px-16 md:py-16',
        )}
      >
        <h1 className={cn(sectionTitleClass, 'text-xl md:text-2xl')}>
          Sorry, this content isn&apos;t available
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed md:text-base dark:text-slate-700">
          The page or item you&apos;re trying to access can&apos;t be displayed
          right now. It may have been moved, deleted, or is temporarily
          unavailable.
        </p>
        <div className="align-center flex justify-center pt-8">
          <Link to={ctaTo} className={cn(primaryBtn, 'min-w-[160px] pt-2')}>
            {ctaLabel}
          </Link>
        </div>
      </Card>
    </div>
  );
}

export function NotFoundPage({ variant = 'full' }: NotFoundPageProps) {
  const isAuthed = hasStoredAuthToken();
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
