import {
  fetchUserProfile,
  fetchUserStatistics,
  type UserPublicProfile,
  type ProfileStatistics,
} from '@/features/profile/api/profile.api';
import { useQuery } from '@tanstack/react-query';

export const userProfileKeys = {
  all: ['user-profile'] as const,
  detail: (userId: string) => [...userProfileKeys.all, userId] as const,
  stats: (userId: string) =>
    [...userProfileKeys.detail(userId), 'stats'] as const,
};

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: userProfileKeys.detail(userId),
    queryFn: () => fetchUserProfile(userId),
    staleTime: 60 * 1000,
  });
}

export function useUserStatistics(userId: string) {
  return useQuery<ProfileStatistics>({
    queryKey: userProfileKeys.stats(userId),
    queryFn: () => fetchUserStatistics(userId),
    staleTime: 5 * 60 * 1000,
  });
}

export type { UserPublicProfile, ProfileStatistics };
