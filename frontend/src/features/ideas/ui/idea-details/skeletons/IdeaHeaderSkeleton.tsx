import { Skeleton } from '@/shared/ui/skeleton';

const TEAM_AVATAR_KEYS = ['a', 'b', 'c', 'd'] as const;

export function IdeaHeaderSkeleton() {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1 space-y-4">
        <Skeleton className="h-8 w-full max-w-xl sm:h-10" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-10" />
            <div className="flex -space-x-2">
            {TEAM_AVATAR_KEYS.map(key => (
              <Skeleton
                key={key}
                className="size-9 rounded-full ring-2 ring-white"
              />
            ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full shrink-0 rounded-sm md:w-32" />
    </header>
  );
}
