import { StatisticsLeaderboardPage } from '@/pages/statistics/ui/StatisticsLeaderboardPage';
import { createFileRoute } from '@tanstack/react-router';

import { pageDocumentHead } from '@/shared/lib/document-head';

export const Route = createFileRoute('/_auth/statistic/leaderboard')({
  head: () => pageDocumentHead('Leaderboard'),
  validateSearch: (search: Record<string, unknown>) => {
    const raw = Number(search.page);
    return { page: Number.isInteger(raw) && raw > 0 ? raw : 1 };
  },
  component: StatisticsLeaderboardPage,
});
