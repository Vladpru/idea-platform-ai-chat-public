import type { SummaryStatus } from '@/features/ideas/api/idea-form-api.types';

export const SUMMARY_POLL_INTERVAL_MS = 3000;
export const MAX_SUMMARY_POLL_ATTEMPTS = 3;

type SummaryPollableData = {
  summaryStatus?: SummaryStatus | null;
};

type SummaryPollQuery = {
  state: {
    data: SummaryPollableData | null | undefined;
    dataUpdateCount: number;
  };
};

export function getSummaryRefetchInterval(query: SummaryPollQuery): number | false {
  const summaryStatus = query.state.data?.summaryStatus;

  if (summaryStatus !== 'PENDING') {
    return false;
  }

  const pollAttempts = Math.max(0, query.state.dataUpdateCount - 1);
  if (pollAttempts >= MAX_SUMMARY_POLL_ATTEMPTS) {
    return false;
  }

  return SUMMARY_POLL_INTERVAL_MS;
}
