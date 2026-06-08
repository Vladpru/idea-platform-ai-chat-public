export type StatisticsPeriod = 'week' | 'month' | 'year';

export type StatisticsEntityType = 'idea' | 'problem';

export interface StatisticsDataPoint {
  label: string;
  value: number;
}

export interface StatisticsStatusChange {
  label: string;
  percent: number;
}

export interface StatisticsMetric {
  label: string;
  value: number;
}

export interface StatisticsContributor {
  id: string;
  name: string;
  score: number;
  avatarUrl: string | null;
}

export interface StatisticsSnapshotResponse {
  newIdeasTotal: number;
  newIdeasSeries: StatisticsDataPoint[];
  statusChanges: StatisticsStatusChange[];
  users: StatisticsMetric[];
  activity: StatisticsMetric[];
  topContributors: StatisticsContributor[];
}
