import type { SummaryStatus } from '@/features/ideas/api/idea-form-api.types';

export const SUMMARY_POLL_INTERVAL_MS = 3000;
export const MAX_SUMMARY_POLL_ATTEMPTS = 3;
export const ENTITY_DETAILS_POLL_INTERVAL_MS = 30_000;

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

  if (summaryStatus === 'PENDING') {
    const pollAttempts = Math.max(0, query.state.dataUpdateCount - 1);
    if (pollAttempts < MAX_SUMMARY_POLL_ATTEMPTS) {
      return SUMMARY_POLL_INTERVAL_MS;
    }
  }

  return ENTITY_DETAILS_POLL_INTERVAL_MS;
}
