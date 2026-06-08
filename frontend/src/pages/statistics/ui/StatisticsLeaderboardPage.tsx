import { LeaderboardPage } from '@/features/statistics/ui/leaderboard/LeaderboardPage';
import type { StatisticsPeriod } from '@/features/statistics/model/statistics.types';

const LEADERBOARD_PERIODS = [
  'day',
  'month',
  'year',
  'year_to_date',
  'all_time',
] as const satisfies readonly StatisticsPeriod[];

type StatisticsLeaderboardPageProps = {
  period?: string;
};

export function StatisticsLeaderboardPage({
  period,
}: StatisticsLeaderboardPageProps) {
  const initialPeriod = LEADERBOARD_PERIODS.includes(period as StatisticsPeriod)
    ? (period as StatisticsPeriod)
    : 'year_to_date';

  return <LeaderboardPage initialPeriod={initialPeriod} />;
}
