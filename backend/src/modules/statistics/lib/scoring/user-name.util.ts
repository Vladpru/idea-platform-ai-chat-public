import type { ContributorUserRow } from '../query/query.types';

export function formatContributorName(
  user:
    | Pick<ContributorUserRow, 'email' | 'firstName' | 'lastName'>
    | undefined,
): string {
  if (!user) {
    return 'Unknown User';
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return fullName || user.email;
}
