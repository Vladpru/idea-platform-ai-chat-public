import { CommentsIcon } from '@/assets/svg/comments';
import { LikeIcon } from '@/assets/svg/like';
import { StarIcon } from '@/assets/svg/star';
import { ViewsIcon } from '@/assets/svg/views';

import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

import { useUserStatistics } from '../../hooks/use-user-profile';

export function ProfileStats({ profileId }: { profileId: string }) {
  const { data, isLoading } = useUserStatistics(profileId);

  if (isLoading) {
    return (
      <div className="grid w-full grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Ideas',
      value: data?.ideas ?? 0,
      icon: <StarIcon className="text-brand-gray-500 size-4" />,
    },
    {
      label: 'Problems',
      value: data?.problems ?? 0,
      icon: <CommentsIcon className="size-4" />,
    },
    {
      label: 'Likes',
      value: data?.totalLikes ?? 0,
      icon: <LikeIcon className="size-4" />,
    },
    {
      label: 'Views',
      value: data?.totalViews ?? 0,
      icon: <ViewsIcon className="size-4" />,
    },
  ];

  return (
    <div className="grid w-full grid-cols-4 gap-3">
      {stats.map(({ label, value, icon }) => (
        <div
          key={label}
          className="bg-brand-gray-100/60 dark:bg-brand-gray-800/40 border-brand-gray-200 dark:border-brand-gray-700 flex items-center justify-center gap-3 rounded-lg border px-3 py-3"
        >
          {icon}
          <span className="text-brand-gray-500 text-xs font-semibold tracking-wide uppercase">
            {label}
          </span>
          <span
            className={cn(
              'text-base leading-none font-medium tabular-nums',
              value > 0 ? 'text-brand-gray-800' : 'text-brand-gray-500',
            )}
          >
            {value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
