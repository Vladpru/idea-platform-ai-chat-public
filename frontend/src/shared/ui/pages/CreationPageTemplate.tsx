import { pageTitleClass } from '@/features/ideas/lib/styles';
import type { ReactNode } from 'react';

import { Card } from '@/shared/ui/card';

export type CreationPageTemplateProps = {
  title: string;
  quote: string;
  children: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
};

export function CreationPageTemplate({
  title,
  quote,
  children,
  headerAction,
  footer,
}: CreationPageTemplateProps) {
  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Card className="text-card-foreground rounded-none bg-white p-6 md:p-10">
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
