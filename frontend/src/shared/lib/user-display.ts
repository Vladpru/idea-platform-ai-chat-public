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

export function getAuthorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}
