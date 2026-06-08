import { StatisticsLeaderboardPage } from '@/pages/statistics/ui/StatisticsLeaderboardPage';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/statistic/leaderboard')({
  head: () => pageDocumentHead('Leaderboard'),
  validateSearch: (search: Record<string, unknown>) => ({
    period: typeof search.period === 'string' ? search.period : undefined,
  }),
  component: LeaderboardRoute,
});

function LeaderboardRoute() {
  const { period } = Route.useSearch();

  return <StatisticsLeaderboardPage period={period} />;
}
