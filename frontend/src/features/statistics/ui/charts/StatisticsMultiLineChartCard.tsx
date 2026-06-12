import { useState } from 'react';

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
  const [activeSeries, setActiveSeries] = useState<string | null>(null);

  function handleLegendClick(key: string) {
    setActiveSeries(prev => (prev === key ? null : key));
  }

  return (
    <section
      className={cn(
        `${statisticsCardClass} h-full w-full`,
        isFetching && 'opacity-70',
      )}
    >
      <h2 className="text-brand-black text-lg font-bold">{title}</h2>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {panel.series.map(series => {
          const isActive = activeSeries === series.key;
          const isInactive = activeSeries !== null && !isActive;

          return (
            <button
              key={series.key}
              type="button"
              onClick={() => handleLegendClick(series.key)}
              className={cn(
                'flex cursor-pointer items-center gap-2 transition-opacity',
                isInactive && 'opacity-40',
              )}
            >
              <span
                className={cn(
                  'shrink-0 rounded-full transition-all',
                  isActive ? 'size-3' : 'size-2.5',
                )}
                style={{ backgroundColor: getStatisticsSeriesColor(series.key) }}
                aria-hidden
              />
              <span
                className={cn(
                  'text-brand-black text-sm transition-all',
                  isActive ? 'font-bold' : 'font-semibold',
                )}
              >
                {series.label}
              </span>
              <span className="bg-brand-gray-100 text-brand-gray-700 rounded px-2 py-0.5 text-xs font-bold tabular-nums">
                {series.total}
              </span>
            </button>
          );
        })}
      </div>

      <StatisticsMultiLineChart
        panel={panel}
        ariaLabel={ariaLabel}
        fillSeriesKey={fillSeriesKey}
        period={period}
        activeSeries={activeSeries}
      />
    </section>
  );
}
