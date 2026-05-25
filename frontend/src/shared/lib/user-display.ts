export type UserDisplayFields = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

/** Same rules as profile page and header: full name, else email local-part. */
export function formatUserDisplayName(
  user: UserDisplayFields,
  fallback = 'User',
): string {
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  if (full) return full;
  const email = user.email?.trim();
  if (email) {
    const local = email.split('@')[0];
    if (local) return local;
  }
  return fallback;
}
