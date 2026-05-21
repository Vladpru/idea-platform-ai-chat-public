import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';

type IdeaFeaturedImageSkeletonProps = {
  className?: string;
};

export function IdeaFeaturedImageSkeleton({
  className,
}: IdeaFeaturedImageSkeletonProps) {
  return (
    <Skeleton
      className={cn('aspect-video w-full max-h-[400px] min-h-[200px]', className)}
    />
  );
}
