import { cn } from '@/shared/lib/utils';

import { getStatisticsSeriesColor } from '../../lib/chart-series-colors';
import type {
  StatisticsChartPanel,
  StatisticsPeriod,
} from '../../model/statistics.types';
import { statisticsCardClass } from '../statistics-classes';
import { StatisticsMultiLineChart } from './StatisticsMultiLineChart';

type StatisticsMultiLineChartCardProps = {
  title: string;
  panel: StatisticsChartPanel;
  ariaLabel: string;
  fillSeriesKey?: string;
  period?: StatisticsPeriod;
  isFetching?: boolean;
};

export function StatisticsMultiLineChartCard({
  title,
  panel,
  ariaLabel,
  fillSeriesKey,
  period,
  isFetching = false,
}: StatisticsMultiLineChartCardProps) {
  return (
    <section
      className={cn(
        `${statisticsCardClass} h-full w-full`,
        isFetching && 'opacity-70',
      )}
    >
      <h2 className="text-brand-black text-lg font-bold">{title}</h2>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {panel.series.map(series => (
          <div key={series.key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: getStatisticsSeriesColor(series.key) }}
              aria-hidden
            />
            <span className="text-brand-black text-sm font-semibold">
              {series.label}
            </span>
            <span className="bg-brand-gray-100 text-brand-gray-700 rounded px-2 py-0.5 text-xs font-bold tabular-nums">
              {series.total}
            </span>
          </div>
        ))}
      </div>

      <StatisticsMultiLineChart
        panel={panel}
        ariaLabel={ariaLabel}
        fillSeriesKey={fillSeriesKey}
        period={period}
      />
    </section>
  );
}
