import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/chart';

import { getStatisticsSeriesColor } from '../../lib/chart-series-colors';
import type {
  StatisticsChartPanel,
  StatisticsPeriod,
} from '../../model/statistics.types';

const CHART_MARGINS = { top: 12, right: 8, left: 0, bottom: 0 };

function createSeriesDot(seriesKey: string) {
  return (props: { cx?: number; cy?: number; value?: number }) => {
    const { cx, cy, value } = props;
    if (cx == null || cy == null || value == null || value <= 0) {
      return null;
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={`var(--color-${seriesKey})`}
        stroke="var(--statistics-chart-dot-ring)"
        strokeWidth={2}
      />
    );
  };
}

function resolveChartScale(
  rows: StatisticsChartPanel['rows'],
  seriesKeys: string[],
) {
  const maxValue = rows.reduce((max, row) => {
    const rowMax = seriesKeys.reduce(
      (seriesMax, key) =>
        Math.max(seriesMax, typeof row[key] === 'number' ? row[key] : 0),
      0,
    );
    return Math.max(max, rowMax);
  }, 0);

  const yMax = Math.max(10, Math.ceil(maxValue / 10) * 10);
  const step = yMax <= 100 ? 10 : 20;
  const yTicks: number[] = [];
  for (let tick = 0; tick <= yMax; tick += step) {
    yTicks.push(tick);
  }

  return { yMax, yTicks };
}

type StatisticsMultiLineChartProps = {
  panel: StatisticsChartPanel;
  ariaLabel: string;
  fillSeriesKey?: string;
  period?: StatisticsPeriod;
};

export function StatisticsMultiLineChart({
  panel,
  ariaLabel,
  fillSeriesKey,
  period,
}: StatisticsMultiLineChartProps) {
  const isDenseDayView = period === 'day';
  const seriesKeys = panel.series.map(series => series.key);

  const chartConfig = useMemo(
    () =>
      panel.series.reduce<ChartConfig>((config, series) => {
        config[series.key] = {
          label: series.label,
          color: getStatisticsSeriesColor(series.key),
        };
        return config;
      }, {}),
    [panel.series],
  );

  const { yMax, yTicks } = useMemo(
    () => resolveChartScale(panel.rows, seriesKeys),
    [panel.rows, seriesKeys],
  );

  const areaKey = fillSeriesKey ?? seriesKeys[0];

  return (
    <ChartContainer
      config={chartConfig}
      className="mt-4 aspect-auto h-[220px] w-full min-w-0 rounded-md [&_.recharts-cartesian-grid_line]:stroke-[var(--statistics-chart-grid)]"
      initialDimension={{ width: 360, height: 220 }}
    >
      <ComposedChart
        accessibilityLayer
        data={panel.rows}
        margin={CHART_MARGINS}
        aria-label={ariaLabel}
      >
        <CartesianGrid
          aria-hidden="true"
          vertical
          horizontal
          strokeDasharray="4 4"
          stroke="var(--statistics-chart-grid)"
          strokeWidth={1}
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          interval={isDenseDayView ? 3 : 'preserveStartEnd'}
          minTickGap={isDenseDayView ? 8 : 24}
          tick={{
            fill: 'var(--statistics-chart-axis-label)',
            fontSize: 11,
            fontWeight: 500,
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={[0, yMax]}
          ticks={yTicks}
          tick={{
            fill: 'var(--statistics-chart-axis-value)',
            fontSize: 10,
          }}
        />
        <ChartTooltip
          cursor={{
            stroke: 'var(--statistics-chart-cursor)',
            strokeWidth: 1,
          }}
          content={({ active, payload, label }) => (
            <ChartTooltipContent
              active={active}
              payload={payload?.filter(item => item.stroke !== 'none')}
              label={label}
              labelKey="label"
              indicator="dot"
            />
          )}
        />
        {areaKey ? (
          <Area
            type="monotone"
            dataKey={areaKey}
            stroke="none"
            fill={`color-mix(in srgb, ${getStatisticsSeriesColor(areaKey)} 18%, transparent)`}
            fillOpacity={1}
            isAnimationActive={false}
          />
        ) : null}
        {panel.series.map(series => (
          <Line
            key={series.key}
            dataKey={series.key}
            type="monotone"
            stroke={`var(--color-${series.key})`}
            strokeWidth={2.5}
            dot={createSeriesDot(series.key)}
            activeDot={{
              r: 5,
              fill: `var(--color-${series.key})`,
              stroke: 'var(--statistics-chart-dot-ring)',
              strokeWidth: 2,
            }}
          />
        ))}
      </ComposedChart>
    </ChartContainer>
  );
}
