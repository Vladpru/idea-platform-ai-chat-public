import { cn } from '@/shared/lib/utils';

import type {
  NewIdeasDataPoint,
  StatisticsPeriod,
} from '../model/statistics.types';

import { NewIdeasLineChart } from './NewIdeasLineChart';
import { StatisticsPeriodSelect } from './StatisticsPeriodSelect';
import { statisticsCardClass } from './statistics-classes';

type NewIdeasChartCardProps = {
  period: StatisticsPeriod;
  onPeriodChange: (period: StatisticsPeriod) => void;
  newIdeasTotal: number;
  newIdeasSeries: NewIdeasDataPoint[];
  isFetching?: boolean;
};

export function NewIdeasChartCard({
  period,
  onPeriodChange,
  newIdeasTotal,
  newIdeasSeries,
  isFetching = false,
}: NewIdeasChartCardProps) {
  return (
    <section
      className={cn(`${statisticsCardClass} h-full w-full`, isFetching && 'opacity-70')}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-brand-dark-blue flex flex-wrap items-center gap-2 text-base font-semibold sm:text-lg">
          <span>New ideas:</span>
          <span className="bg-brand-light-blue text-brand-dark-blue rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums">
            {newIdeasTotal}
          </span>
        </div>
        <StatisticsPeriodSelect value={period} onChange={onPeriodChange} />
      </div>
      <NewIdeasLineChart data={newIdeasSeries} />
    </section>
  );
}
