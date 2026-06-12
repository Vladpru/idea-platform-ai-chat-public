export type BucketCountRow = { bucket: Date; count: bigint };

export type EarliestDateRow = { earliest: Date | null };

export type LeaderboardScoreRow = {
  user_id: string;
  total: bigint;
  ideas: bigint;
  updates: bigint;
  joined_projects: bigint;
  comments: bigint;
  views: bigint;
  likes: bigint;
  completed_ideas: bigint;
  badges: bigint;
};

export type UserScoreBreakdownRow = {
  ideas_count: bigint;
  ideas_points: bigint;
  updates_count: bigint;
  updates_points: bigint;
  joined_projects_count: bigint;
  joined_projects_points: bigint;
  comments_count: bigint;
  comments_points: bigint;
  views_count: bigint;
  views_points: bigint;
  likes_count: bigint;
  likes_points: bigint;
  completed_ideas_count: bigint;
  completed_ideas_points: bigint;
  badges_count: bigint;
  badges_points: bigint;
};

export type ContributorUserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};
