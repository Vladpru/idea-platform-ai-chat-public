import type { LeaderboardBreakdown } from '../../../../shared/types/statistics.types';

export type ScoreCategoryKey = keyof LeaderboardBreakdown;

export type ScoreCategoryCountBreakdown = Record<
  ScoreCategoryKey,
  { count: number; points: number }
>;

type ScoreCategoryDefinition = {
  key: ScoreCategoryKey;
  label: string;
  singularLabel: string;
};

export const SCORE_CATEGORY_DEFINITIONS: ScoreCategoryDefinition[] = [
  { key: 'ideas', label: 'Ideas', singularLabel: 'Idea' },
  { key: 'updates', label: 'Updates', singularLabel: 'Update' },
  {
    key: 'joinedProjects',
    label: 'Joined projects',
    singularLabel: 'Joined project',
  },
  { key: 'comments', label: 'Comments', singularLabel: 'Comment' },
  { key: 'views', label: 'Views', singularLabel: 'View' },
  { key: 'likes', label: 'Likes', singularLabel: 'Like' },
  {
    key: 'completedIdeas',
    label: 'Completed ideas',
    singularLabel: 'Completed idea',
  },
  { key: 'badges', label: 'Badges', singularLabel: 'Badge' },
];

export function formatScoreCategoryCountLabel(
  count: number,
  definition: ScoreCategoryDefinition,
): string {
  const noun =
    count === 1 ? definition.singularLabel : definition.label.toLowerCase();

  return `${count} ${noun}`;
}
