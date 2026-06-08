export type StatisticsPeriod =
  | 'day'
  | 'month'
  | 'year'
  | 'year_to_date'
  | 'all_time';

export type StatisticsBucketGranularity = 'hour' | 'day' | 'month';

export interface StatisticsDataPoint {
  label: string;
  value: number;
}

export interface StatisticsChartSeries {
  key: string;
  label: string;
  total: number;
  points: StatisticsDataPoint[];
}

export interface StatisticsChartRow {
  label: string;
  [seriesKey: string]: string | number;
}

export interface StatisticsChartPanel {
  series: Array<Pick<StatisticsChartSeries, 'key' | 'label' | 'total'>>;
  rows: StatisticsChartRow[];
}

export interface StatisticsMetric {
  label: string;
  value: number;
}

export interface StatisticsContributor {
  id: string;
  name: string;
  points: number;
  avatarUrl: string | null;
}

export interface LeaderboardBreakdown {
  ideas: number;
  updates: number;
  joinedProjects: number;
  comments: number;
  views: number;
  likes: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  avatarUrl: string | null;
  breakdown: LeaderboardBreakdown;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

export interface StatisticsChartsResponse {
  newEntities: StatisticsChartPanel;
  users: StatisticsChartPanel;
  activity: StatisticsChartPanel;
}

export interface StatisticsSnapshotResponse {
  charts: StatisticsChartsResponse;
  users: StatisticsMetric[];
  activity: StatisticsMetric[];
  topContributors: StatisticsContributor[];
  costBenefitTotal: number;
}
