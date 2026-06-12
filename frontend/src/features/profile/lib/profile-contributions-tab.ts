import type { ProfileContributionsTab } from '@/features/profile/model/profile-contributions.types';

export type ProfileContributionsSearchTab =
  | 'all'
  | 'ideas'
  | 'problems'
  | 'joined'
  | 'drafts';

export function toContributionsApiTab(
  tab: ProfileContributionsSearchTab,
): ProfileContributionsTab {
  if (tab === 'ideas') return 'idea';
  if (tab === 'problems') return 'problem';
  if (tab === 'joined') return 'joined';
  if (tab === 'drafts') return 'drafts';
  return 'all';
}

export function toContributionsSearchTab(
  tab: ProfileContributionsTab,
): ProfileContributionsSearchTab {
  if (tab === 'idea') return 'ideas';
  if (tab === 'problem') return 'problems';
  if (tab === 'joined') return 'joined';
  if (tab === 'drafts') return 'drafts';
  return 'all';
}
