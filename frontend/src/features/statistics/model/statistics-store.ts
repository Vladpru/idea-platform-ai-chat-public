import { create } from 'zustand';

import type { StatisticsPeriod } from './statistics.types';

export const DEFAULT_STATISTICS_PERIOD: StatisticsPeriod = 'year_to_date';

type StatisticsStore = {
  period: StatisticsPeriod;
  setPeriod: (period: StatisticsPeriod) => void;
};

export const useStatisticsStore = create<StatisticsStore>(set => ({
  period: DEFAULT_STATISTICS_PERIOD,
  setPeriod: period => set({ period }),
}));
