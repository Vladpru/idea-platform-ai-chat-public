import { SummaryStatus } from '../../../generated/prisma/client';

export type SummaryResetData = {
  aiSummary: null;
  summaryStatus: SummaryStatus;
  summaryRequestedAt: Date | null;
};

export function buildSummaryResetData(
  shouldQueueSummary: boolean,
): SummaryResetData {
  return {
    aiSummary: null,
    summaryStatus: shouldQueueSummary
      ? SummaryStatus.PENDING
      : SummaryStatus.SKIPPED,
    summaryRequestedAt: shouldQueueSummary ? new Date() : null,
  };
}
