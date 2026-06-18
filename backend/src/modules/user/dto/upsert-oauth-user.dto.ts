import type { UserPublic } from '../../../shared/types/user.types';

export type UpsertOAuthUserInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export type UpsertOAuthUserResult = {
  user: UserPublic;
  isNewUser: boolean;
};
