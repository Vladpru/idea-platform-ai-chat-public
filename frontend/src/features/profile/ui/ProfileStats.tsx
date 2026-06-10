import { Skeleton } from '@/shared/ui/skeleton';
import { useUserStatistics } from '../hooks/use-user-profile';

export function ProfileStats({ profileId }: { profileId: string }) {
  const { data, isLoading } = useUserStatistics(profileId);
  if (isLoading) {
    return (
      <div className="mt-3 flex gap-4">
        <Skeleton className="h-4 w-20 rounded-sm" />
        <Skeleton className="h-4 w-20 rounded-sm" />
        <Skeleton className="h-4 w-20 rounded-sm" />
        <Skeleton className="h-4 w-20 rounded-sm" />
      </div>
    );
  }

  return (
    <div className="text-brand-gray-500 flex gap-4 text-sm font-semibold tracking-wide">
      <span>{data?.ideas ?? 0} ideas</span>
      <span>•</span>
      <span>{data?.problems ?? 0} problems</span>
      <span>•</span>
      <span>{data?.totalLikes ?? 0} likes</span>
      <span>•</span>
      <span>{data?.totalViews ?? 0} views</span>
    </div>
  );
}
