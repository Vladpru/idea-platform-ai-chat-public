import { useEffect, useState, type ReactNode } from 'react';

import { CircleAlert } from 'lucide-react';

import type { SummaryStatus } from '@/features/ideas/api/idea-form-api.types';

import { AiSummarySkeleton } from './AiSummarySkeleton';

const MAX_POLLING_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 3000;

type EntityAiSummaryBlockProps = {
  aiSummary: string | null;
  summaryStatus: SummaryStatus | null;
  onPoll?: () => void;
};

type SummarySectionProps = {
  busy?: boolean;
  children: ReactNode;
};

function SummarySection({ busy = false, children }: SummarySectionProps) {
  return (
    <section
      className="border-brand-gray-200 bg-brand-neutral/40 space-y-3 rounded-lg border px-4 py-4"
      aria-busy={busy || undefined}
      aria-label={busy ? 'AI summary loading' : 'AI summary'}
    >
      <h2 className="text-brand-gray-600 text-xs font-semibold tracking-wide uppercase">
        AI Summary
      </h2>
      {children}
    </section>
  );
}

function SummaryUnavailableFallback() {
  return (
    <div className="flex items-start gap-3">
      <CircleAlert
        className="text-brand-gray-400 mt-0.5 size-4 shrink-0"
        aria-hidden
      />
      <p className="text-brand-gray-500 text-sm leading-relaxed">
        Summary is currently unavailable. Please try again later.
      </p>
    </div>
  );
}

export function EntityAiSummaryBlock({
  aiSummary,
  summaryStatus,
  onPoll,
}: EntityAiSummaryBlockProps) {
  const [pendingTicks, setPendingTicks] = useState(0);
  const [prevStatus, setPrevStatus] = useState<SummaryStatus | null>(null);

  if (summaryStatus !== prevStatus) {
    setPrevStatus(summaryStatus);
    setPendingTicks(0);
  }

  useEffect(() => {
    if (summaryStatus !== 'PENDING') {
      return;
    }

    onPoll?.();

    const timer = window.setInterval(() => {
      setPendingTicks(current => current + 1);
      onPoll?.();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [summaryStatus, onPoll]);

  if (!summaryStatus) {
    return null;
  }

  if (summaryStatus === 'FAILED') {
    return (
      <SummarySection>
        <SummaryUnavailableFallback />
      </SummarySection>
    );
  }

  if (summaryStatus === 'PENDING') {
    if (!aiSummary && pendingTicks >= MAX_POLLING_ATTEMPTS) {
      return (
        <SummarySection>
          <SummaryUnavailableFallback />
        </SummarySection>
      );
    }

    return (
      <SummarySection busy>
        <AiSummarySkeleton />
      </SummarySection>
    );
  }

  if (summaryStatus === 'COMPLETED') {
    if (!aiSummary) {
      return (
        <SummarySection>
          <SummaryUnavailableFallback />
        </SummarySection>
      );
    }

    return (
      <SummarySection>
        <p className="text-brand-gray-800 font-EB-Garamond text-sm leading-relaxed whitespace-pre-wrap sm:text-base">
          {aiSummary}
        </p>
      </SummarySection>
    );
  }

  return null;
}
