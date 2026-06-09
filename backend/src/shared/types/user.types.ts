import type { ThemePreference } from '../../../generated/prisma/client';
import type { NotificationPreferencesMap } from '../../notification/events/notification.events';

export interface IGoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

/** Public user fields returned from the API (matches `USER_PUBLIC_SELECT` in UserService). */
export interface UserPublic {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  themePreference: ThemePreference;
  notificationPreferences: NotificationPreferencesMap;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrentUserPublic extends UserPublic {
  hasPassword: boolean;
}
