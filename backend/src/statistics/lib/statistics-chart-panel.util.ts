import type {
  StatisticsChartPanel,
  StatisticsChartSeries,
  StatisticsDataPoint,
} from '../../shared/types/statistics.types';

export function sumSeriesPoints(points: StatisticsDataPoint[]): number {
  return points.reduce((sum, point) => sum + point.value, 0);
}

export function buildChartPanel(
  seriesList: StatisticsChartSeries[],
): StatisticsChartPanel {
  const labelOrder: string[] = [];
  const rowByLabel = new Map<string, Record<string, number>>();

  for (const series of seriesList) {
    for (const point of series.points) {
      if (!rowByLabel.has(point.label)) {
        labelOrder.push(point.label);
        rowByLabel.set(point.label, {});
      }

      rowByLabel.get(point.label)![series.key] = point.value;
    }
  }

  return {
    series: seriesList.map(({ key, label, total }) => ({ key, label, total })),
    rows: labelOrder.map(label => ({
      label,
      ...rowByLabel.get(label)!,
    })),
  };
}
