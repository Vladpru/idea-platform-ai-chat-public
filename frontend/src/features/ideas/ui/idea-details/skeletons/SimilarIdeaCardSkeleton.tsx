import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';

type SimilarIdeaCardSkeletonProps = {
  className?: string;
};

export function SimilarIdeaCardSkeleton({
  className,
}: SimilarIdeaCardSkeletonProps) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border border-brand-gray-200 bg-white',
        className,
      )}
      aria-hidden
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </article>
  );
}
