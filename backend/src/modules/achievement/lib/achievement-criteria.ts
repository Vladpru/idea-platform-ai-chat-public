export const ACHIEVEMENT_KEYS = [
  'innovator',
  'active_voice',
  'collaborator',
  'completer',
  'connector',
  'top_contributor',
] as const;

export type AchievementKey = (typeof ACHIEVEMENT_KEYS)[number];

export type AchievementTrigger =
  | 'IDEA_PUBLISHED'
  | 'COMMENT_CREATED'
  | 'PROJECT_JOINED'
  | 'IDEA_COMPLETED'
  | 'USER_INVITED'
  | 'MONTHLY_CRON';

export const ACHIEVEMENT_DEFINITIONS: Array<{
  key: AchievementKey;
  name: string;
  description: string;
  iconPath: string;
  threshold: number | null;
}> = [
  {
    key: 'innovator',
    name: 'Innovator',
    description: 'Published 5 ideas',
    iconPath: 'achievements/Innovator.svg',
    threshold: 5,
  },
  {
    key: 'active_voice',
    name: 'Active Voice',
    description: 'Posted 10 comments',
    iconPath: 'achievements/ActiveVoice.svg',
    threshold: 10,
  },
  {
    key: 'collaborator',
    name: 'Collaborator',
    description: 'Joined 10 projects',
    iconPath: 'achievements/Collaborator.svg',
    threshold: 10,
  },
  {
    key: 'completer',
    name: 'Completer',
    description: 'Completed 3 ideas',
    iconPath: 'achievements/Completer.svg',
    threshold: 3,
  },
  {
    key: 'connector',
    name: 'Connector',
    description: 'Invited 5 collaborators',
    iconPath: 'achievements/Connector.svg',
    threshold: 5,
  },
  {
    key: 'top_contributor',
    name: 'Top Contributor',
    description: 'Top monthly contributor',
    iconPath: 'achievements/TopContributor.svg',
    threshold: null,
  },
];

export const TRIGGER_TO_BADGE_KEY: Record<
  Exclude<AchievementTrigger, 'MONTHLY_CRON'>,
  AchievementKey
> = {
  IDEA_PUBLISHED: 'innovator',
  COMMENT_CREATED: 'active_voice',
  PROJECT_JOINED: 'collaborator',
  IDEA_COMPLETED: 'completer',
  USER_INVITED: 'connector',
};
