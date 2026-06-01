import * as React from 'react';

import { cn } from '@/shared/lib/utils';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/** Matches bordered dashboard / search result cards (see DashboardCardStandard). */
const skeletonCardChromeClass =
  'border-brand-gray-200 rounded-lg border bg-white';

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('skeleton-glimmer rounded-md', className)}
      {...props}
    />
  );
}

/** Bordered card placeholder for dashboard grids and list loading states. */
export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton className={cn(skeletonCardChromeClass, className)} {...props} />
  );
}
