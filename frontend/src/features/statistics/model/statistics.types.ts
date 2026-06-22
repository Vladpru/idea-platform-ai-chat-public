import type { UserAchievementDto } from '@/features/achievements';

export type StatisticsPeriod =
  | 'day'
  | 'month'
  | 'year'
  | 'year_to_date'
  | 'all_time';

export type StatisticsChartRow = {
  label: string;
  [seriesKey: string]: string | number;
};

export type StatisticsChartSeriesMeta = {
  key: string;
  label: string;
  total: number;
};

export type StatisticsChartPanel = {
  series: StatisticsChartSeriesMeta[];
  rows: StatisticsChartRow[];
};

export type StatMetric = {
  label: string;
  value: number;
};

export type TopContributor = {
  id: string;
  name: string;
  points: number;
  avatarUrl: string | null;
  achievements: UserAchievementDto[];
};

export type LeaderboardBreakdown = {
  ideas: number;
  updates: number;
  joinedProjects: number;
  comments: number;
  views: number;
  likes: number;
  completedIdeas: number;
  badges: number;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  points: number;
  avatarUrl: string | null;
  breakdown: LeaderboardBreakdown;
  achievements: UserAchievementDto[];
};

export type LeaderboardResponse = {
  data: LeaderboardEntry[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
};

export type StatisticsCharts = {
  newEntities: StatisticsChartPanel;
  users: StatisticsChartPanel;
  activity: StatisticsChartPanel;
};

export type ScoreCategoryKey = keyof LeaderboardBreakdown;

export type MyScoreCategory = {
  key: ScoreCategoryKey;
  label: string;
  countLabel: string;
  count: number;
  points: number;
};

export type MyScore = {
  totalPoints: number;
  categories: MyScoreCategory[];
};

export type StatisticsSnapshot = {
  charts: StatisticsCharts;
  users: StatMetric[];
  activity: StatMetric[];
  topContributors: TopContributor[];
  costBenefitTotal: number;
  myScore: MyScore;
};
