import type { LeaderboardBreakdown } from '../model/statistics.types';

const BREAKDOWN_LABELS: Record<keyof LeaderboardBreakdown, string> = {
  ideas: 'Ideas',
  updates: 'Updates',
  joinedProjects: 'Joined projects',
  comments: 'Comments',
  views: 'Views',
  likes: 'Likes',
  completedIdeas: 'Completed ideas',
  badges: 'Badges',
};

export function getLeaderboardBreakdownItems(breakdown: LeaderboardBreakdown) {
  return (Object.keys(BREAKDOWN_LABELS) as Array<keyof LeaderboardBreakdown>)
    .map(key => ({
      key,
      label: BREAKDOWN_LABELS[key],
      value: breakdown[key],
    }))
    .filter(item => item.value > 0);
}
