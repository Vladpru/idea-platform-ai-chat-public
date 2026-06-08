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
};

export type LeaderboardBreakdown = {
  ideas: number;
  updates: number;
  joinedProjects: number;
  comments: number;
  views: number;
  likes: number;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  points: number;
  avatarUrl: string | null;
  breakdown: LeaderboardBreakdown;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
};

export type StatisticsCharts = {
  newEntities: StatisticsChartPanel;
  users: StatisticsChartPanel;
  activity: StatisticsChartPanel;
};

export type StatisticsSnapshot = {
  charts: StatisticsCharts;
  users: StatMetric[];
  activity: StatMetric[];
  topContributors: TopContributor[];
  costBenefitTotal: number;
};
