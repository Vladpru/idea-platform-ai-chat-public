import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { useProfileContributions } from '@/features/profile/hooks/use-profile-contributions';
import {
  useSubscribeMutation,
  useUnsubscribeMutation,
} from '@/features/profile/hooks/use-subscription-mutations';
import { useUserProfile } from '@/features/profile/hooks/use-user-profile';
import {
  toContributionsApiTab,
  toContributionsSearchTab,
} from '@/features/profile/lib/profile-contributions-tab';
import type { ProfileContributionsTab } from '@/features/profile/model/profile-contributions.types';
import { EntityGrid } from '@/features/profile/ui/user-profile/EntityGrid';
import { ProfileDraftsTab } from '@/features/profile/ui/user-profile/ProfileDraftsTab';
import { ProfileHeader } from '@/features/profile/ui/user-profile/ProfileHeader';
import { TabsLayout } from '@/features/profile/ui/user-profile/TabsLayout';
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

type UserProfileViewProps = {
  profileId: string;
};

export function UserProfileView({ profileId }: UserProfileViewProps) {
  const currentUserId = useAuthSessionStore(state => state.user?.id);
  const isOwner = Boolean(currentUserId && currentUserId === profileId);
  const navigate = useNavigate();
  const router = useRouter();
  const { tab: searchTab } = useSearch({ from: '/_auth/profile/$profileId' });

  const profileQuery = useUserProfile(profileId);
  const subscribeMutation = useSubscribeMutation(profileId);
  const unsubscribeMutation = useUnsubscribeMutation(profileId);

  const activeTab = useMemo(
    () => toContributionsApiTab(searchTab),
    [searchTab],
  );

  const setActiveTab = useCallback(
    (tab: ProfileContributionsTab) => {
      void navigate({
        to: '/profile/$profileId',
        params: { profileId },
        search: { tab: toContributionsSearchTab(tab) },
      });
    },
    [navigate, profileId],
  );

  useEffect(() => {
    if (activeTab === 'drafts' && !isOwner) {
      void navigate({
        to: '/profile/$profileId',
        params: { profileId },
        search: { tab: 'all' },
        replace: true,
      });
    }
  }, [activeTab, isOwner, navigate, profileId]);

  const isDraftsTab = activeTab === 'drafts';

  const {
    items,
    isLoading: isContributionsLoading,
    isError: isContributionsError,
    error: contributionsError,
    refetch: refetchContributions,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProfileContributions(profileId, isDraftsTab ? 'all' : activeTab);

  const handleLoadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const handleSubscribe = useCallback(() => {
    subscribeMutation.mutate();
  }, [subscribeMutation]);

  const handleUnsubscribe = useCallback(() => {
    unsubscribeMutation.mutate();
  }, [unsubscribeMutation]);

  const isSubscriptionPending =
    subscribeMutation.isPending || unsubscribeMutation.isPending;

  if (profileQuery.isLoading) {
    return (
      <main className="bg-brand-neutral min-h-[calc(100vh-56px)]">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
          <Skeleton className="mb-6 h-16 w-full max-w-xl" />
          <Skeleton className="mb-6 h-10 w-full max-w-lg" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <main className="bg-brand-neutral min-h-[calc(100vh-56px)]">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
          <div className="border-brand-gray-200 bg-card rounded-lg border px-6 py-10 text-center">
            <p className="text-brand-gray-700 mb-4 text-sm">
              {getApiErrorMessage(profileQuery.error, {
                invalidCredentialsMessage: 'Failed to load profile.',
              })}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => profileQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
        {!isOwner && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="size-4" />}
            onClick={() => router.history.back()}
            className="text-brand-gray-700 -ml-3 mb-4"
          >
            Back
          </Button>
        )}

        <ProfileHeader
          profile={profileQuery.data}
          isOwner={isOwner}
          isSubscriptionPending={isSubscriptionPending}
          onSubscribe={handleSubscribe}
          onUnsubscribe={handleUnsubscribe}
        />

        <TabsLayout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOwner={isOwner}
        >
          {isDraftsTab ? (
            <ProfileDraftsTab />
          ) : isContributionsError ? (
            <div className="border-brand-gray-200 bg-card rounded-lg border px-6 py-10 text-center">
              <p className="text-brand-gray-700 mb-4 text-sm">
                {getApiErrorMessage(contributionsError, {
                  invalidCredentialsMessage: 'Failed to load contributions.',
                })}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetchContributions()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <EntityGrid
              items={items}
              isLoading={isContributionsLoading}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              loadMore={handleLoadMore}
            />
          )}
        </TabsLayout>
      </div>
    </main>
  );
}
