export const STATISTICS_CHART_SERIES_COLORS: Record<string, string> = {
  ideas: 'var(--statistics-series-ideas)',
  problems: 'var(--statistics-series-problems)',
  activeUsers: 'var(--statistics-series-active-users)',
  newUsers: 'var(--statistics-series-new-users)',
  updates: 'var(--statistics-series-updates)',
  comments: 'var(--statistics-series-comments)',
  views: 'var(--statistics-series-views)',
  likes: 'var(--statistics-series-likes)',
};

export function getStatisticsSeriesColor(key: string): string {
  return (
    STATISTICS_CHART_SERIES_COLORS[key] ?? 'var(--statistics-chart-line)'
  );
}
