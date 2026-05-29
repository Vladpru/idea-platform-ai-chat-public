export type StatisticsPeriod = 'week' | 'month' | 'year';

export type NewIdeasDataPoint = {
  label: string;
  value: number;
};

export type StatusChangeItem = {
  label: string;
  percent: number;
};

export type StatMetric = {
  label: string;
  value: number;
};

export type TopContributor = {
  id: string;
  name: string;
  score: number;
  avatarUrl: string | null;
};

export type StatisticsSnapshot = {
  newIdeasTotal: number;
  newIdeasSeries: NewIdeasDataPoint[];
  statusChanges: StatusChangeItem[];
  users: StatMetric[];
  activity: StatMetric[];
  topContributors: TopContributor[];
};
