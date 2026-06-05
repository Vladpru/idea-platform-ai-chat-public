import { pageTitleClass } from '@/features/ideas/lib/styles';
import { Link } from '@tanstack/react-router';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { Card } from '@/shared/ui/card';

export type CreationPageTemplateProps = {
  title: string;
  quote: string;
  children: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  backTo?: string;
  loadingOverlay?: boolean;
  loadingMessage?: string;
};

export function CreationPageTemplate({
  title,
  quote,
  children,
  headerAction,
  footer,
  backTo,
  loadingOverlay = false,
  loadingMessage = 'Loading…',
}: CreationPageTemplateProps) {
  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Card
          className={cn(
            'text-card-foreground bg-card relative rounded-none p-6 md:p-10',
            loadingOverlay && 'pointer-events-none',
          )}
        >
          {loadingOverlay ? (
            <div
              role="status"
              aria-live="polite"
              aria-busy="true"
              className="bg-background/70 absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[1px]"
            >
              <Loader2
                className="text-brand-dark-blue size-10 animate-spin"
                aria-hidden
              />
              <p className="text-brand-gray-700 mt-4 max-w-xs text-center text-sm">
                {loadingMessage}
              </p>
            </div>
          ) : null}
          {backTo ? (
            <Link
              to={backTo}
              className="text-primary hover:text-primary/80 mb-4 inline-flex items-center gap-1 text-xs font-bold tracking-wide uppercase transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Link>
          ) : null}
          <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className={pageTitleClass}>{title}</h1>
              <p className="text-brand-dark-blue mt-2 max-w-xl text-sm italic">
                {quote}
              </p>
            </div>
            {headerAction ? (
              <div className="inline-flex shrink-0">{headerAction}</div>
            ) : null}
          </div>
          {children}
        </Card>
      </div>
      {footer}
    </main>
  );
}
