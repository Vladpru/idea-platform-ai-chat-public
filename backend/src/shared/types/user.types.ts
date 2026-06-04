export interface IGoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

import type { ThemePreference } from '../../../generated/prisma/client';

/** Public user fields returned from the API (matches `USER_PUBLIC_SELECT` in UserService). */
export interface UserPublic {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  themePreference: ThemePreference;
  createdAt: Date;
  updatedAt: Date;
}
