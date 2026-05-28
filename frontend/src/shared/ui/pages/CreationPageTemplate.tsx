import { pageTitleClass } from '@/features/ideas/lib/styles';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card } from '@/shared/ui/card';

export type CreationPageTemplateProps = {
  title: string;
  quote: string;
  children: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  backTo?: string;
};

export function CreationPageTemplate({
  title,
  quote,
  children,
  headerAction,
  footer,
  backTo,
}: CreationPageTemplateProps) {
  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Card className="text-card-foreground rounded-none bg-white p-6 md:p-10">
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
