import { StatisticsLeaderboardPage } from '@/pages/statistics/ui/StatisticsLeaderboardPage';
import { createFileRoute } from '@tanstack/react-router';

import { pageDocumentHead } from '@/shared/lib/document-head';

export const Route = createFileRoute('/_auth/statistic/leaderboard')({
  head: () => pageDocumentHead('Leaderboard'),
  component: StatisticsLeaderboardPage,
});
