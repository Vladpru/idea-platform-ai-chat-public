import { buildSummaryResetData } from '../../modules/ai-summary/summary-reset.util';

export function isFirstPublication(
  publishedAt: Date | null | undefined,
): boolean {
  return publishedAt == null;
}

export function buildStatusPublicationUpdate(params: {
  publishedAt: Date | null | undefined;
  requestSummary: boolean;
  status: string;
}): {
  data: Record<string, unknown>;
  shouldNotifySubscribers: boolean;
} {
  if (isFirstPublication(params.publishedAt)) {
    return {
      data: {
        status: params.status,
        publishedAt: new Date(),
        ...buildSummaryResetData(params.requestSummary),
      },
      shouldNotifySubscribers: true,
    };
  }

  return {
    data: {
      status: params.status,
      ...(params.requestSummary ? buildSummaryResetData(true) : {}),
    },
    shouldNotifySubscribers: false,
  };
}
