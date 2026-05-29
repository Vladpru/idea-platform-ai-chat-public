import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/chart';

import type { NewIdeasDataPoint } from '../model/statistics.types';

const CHART_CONFIG = {
  ideas: {
    label: 'New ideas',
    color: 'var(--statistics-chart-line)',
  },
} satisfies ChartConfig;

const CHART_MARGINS = { top: 8, right: 12, left: 0, bottom: 0 };

function resolveChartScale(data: NewIdeasDataPoint[]) {
  const maxValue = data.length === 0 ? 0 : Math.max(...data.map(p => p.value));
  const yMax = Math.max(10, Math.ceil(maxValue / 10) * 10);
  const step = yMax <= 100 ? 10 : 20;
  const yTicks: number[] = [];
  for (let tick = 0; tick <= yMax; tick += step) {
    yTicks.push(tick);
  }
  return { yMax, yTicks };
}

type NewIdeasLineChartProps = {
  data: NewIdeasDataPoint[];
};

export function NewIdeasLineChart({ data }: NewIdeasLineChartProps) {
  const { chartData, yMax, yTicks } = useMemo(() => {
    const chartData = data.map(point => ({
      label: point.label,
      ideas: point.value,
    }));
    const { yMax, yTicks } = resolveChartScale(data);
    return { chartData, yMax, yTicks };
  }, [data]);

  return (
    <ChartContainer
      config={CHART_CONFIG}
      className="mt-4 aspect-auto h-[220px] w-full min-w-0"
      initialDimension={{ width: 520, height: 220 }}
    >
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={CHART_MARGINS}
        aria-label="New ideas over time"
      >
        <CartesianGrid
          aria-hidden="true"
          vertical={false}
          strokeDasharray="2 2"
          stroke="var(--statistics-chart-grid)"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
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
          content={
            <ChartTooltipContent
              labelKey="label"
              nameKey="ideas"
              indicator="dot"
            />
          }
        />
        <Line
          dataKey="ideas"
          type="monotone"
          stroke="var(--color-ideas)"
          strokeWidth={2.5}
          dot={{
            r: 4,
            fill: 'var(--color-ideas)',
            stroke: 'var(--statistics-chart-dot-ring)',
            strokeWidth: 2,
          }}
          activeDot={{
            r: 5,
            fill: 'var(--color-ideas)',
            stroke: 'var(--statistics-chart-dot-ring)',
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ChartContainer>
  );
}
