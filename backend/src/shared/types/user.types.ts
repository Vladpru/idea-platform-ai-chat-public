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
  createdAt: Date;
  updatedAt: Date;
}
