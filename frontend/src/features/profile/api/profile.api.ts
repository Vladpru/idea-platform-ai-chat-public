import type {
  ProfileContribution,
  ProfileContributionsTab,
  ProfileStatistics,
} from '@/features/profile/model/profile-contributions.types';

import { api } from '@/shared/api/http';

export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';

export type NotificationChannelPreferences = {
  inApp: boolean;
  email: boolean;
};

export type NotificationPreferencesMap = {
  newSimilarIdeas: NotificationChannelPreferences;
  newSimilarProblems: NotificationChannelPreferences;
  statusChange: NotificationChannelPreferences;
  newSupporters: NotificationChannelPreferences;
  newComments: NotificationChannelPreferences;
  assignedIdeasAndProblems: NotificationChannelPreferences;
  followUps: NotificationChannelPreferences;
};

/** Matches backend `UserPublic` (JSON dates). */
export type UserPublic = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  themePreference: ThemePreference;
  notificationPreferences: NotificationPreferencesMap;
  bio: string | null;
  socialLinks: string[];
  createdAt: string;
  updatedAt: string;
};

/** Matches backend `CurrentUserPublic` from `GET /users/me`. */
export type CurrentUser = UserPublic & {
  hasPassword: boolean;
};
export type UserPublicProfile = UserPublic & {
  subscriberCount: number;
  isSubscribed: boolean;
};

export type UpdateThemePayload = {
  theme: ThemePreference;
};

export type PatchUserPayload = {
  firstName?: string;
  lastName?: string;
  bio?: string | null;
  socialLinks?: string[] | null;
};

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>('/users/me');
  return data;
}

export function mergeCurrentUser(
  previous: CurrentUser | undefined,
  next: UserPublic,
): CurrentUser {
  return {
    ...previous,
    ...next,
    hasPassword: previous?.hasPassword ?? false,
  };
}

export async function patchTheme(
  payload: UpdateThemePayload,
): Promise<UserPublic> {
  const { data } = await api.patch<UserPublic>('/users/me/theme', payload);
  return data;
}

export async function patchUser(payload: PatchUserPayload): Promise<UserPublic> {
  const { data } = await api.patch<UserPublic>('/users/me', payload);
  return data;
}

export async function uploadMyAvatar(file: File): Promise<UserPublic> {
  const body = new FormData();
  body.append('file', file);
  const { data } = await api.post<UserPublic>('/users/me/avatar', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function removeMyAvatar(): Promise<UserPublic> {
  const { data } = await api.delete<UserPublic>('/users/me/avatar');
  return data;
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> {
  const { data } = await api.patch<ChangePasswordResponse>(
    '/users/me/password',
    payload,
    { skipAuthRefresh: true },
  );
  return data;
}

export type { ProfileContributionsTab, ProfileStatistics };

type ContributionsApiParams = {
  type: 'all' | 'idea' | 'problem';
  tab: 'authored' | 'joined';
};

function mapContributionsQuery(
  tab: ProfileContributionsTab,
): ContributionsApiParams {
  switch (tab) {
    case 'idea':
      return { type: 'idea', tab: 'authored' };
    case 'problem':
      return { type: 'problem', tab: 'authored' };
    case 'joined':
      return { type: 'all', tab: 'joined' };
    case 'all':
    default:
      return { type: 'all', tab: 'authored' };
  }
}

export type FetchProfileContributionsParams = {
  profileId: string;
  skip: number;
  take: number;
  tab?: ProfileContributionsTab;
};

export type ProfileContributionsResponse = {
  data: ProfileContribution[];
  meta: {
    skip: number;
    take: number;
    total: number;
  };
};

export async function fetchUserProfile(
  userId: string,
): Promise<UserPublicProfile> {
  const { data } = await api.get<UserPublicProfile>(`/users/${userId}`);
  return data;
}

export async function subscribeToUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/subscribe`);
}

export async function unsubscribeFromUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}/subscribe`);
}

export async function fetchProfileContributions({
  profileId,
  skip,
  take,
  tab = 'all',
}: FetchProfileContributionsParams): Promise<ProfileContributionsResponse> {
  const query = mapContributionsQuery(tab);

  const { data } = await api.get<ProfileContributionsResponse>(
    `/users/${profileId}/contributions`,
    {
      params: {
        skip,
        take,
        type: query.type,
        tab: query.tab,
      },
    },
  );
  return data;
}

export async function fetchUserStatistics(
  userId: string,
): Promise<ProfileStatistics> {
  const { data } = await api.get<ProfileStatistics>(
    `/users/${userId}/statistics`,
  );
  return data;
}
