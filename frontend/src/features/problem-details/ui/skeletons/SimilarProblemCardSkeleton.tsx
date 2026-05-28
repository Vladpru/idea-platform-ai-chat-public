import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';

type SimilarProblemCardSkeletonProps = {
  className?: string;
};

export function SimilarProblemCardSkeleton({
  className,
}: SimilarProblemCardSkeletonProps) {
  return (
    <article
      className={cn(
        'space-y-4 rounded-lg border border-brand-gray-200 bg-white p-4 sm:p-5',
        className,
      )}
      aria-hidden
    >
      <Skeleton className="h-5 w-4/5" />
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    </article>
  );
}
