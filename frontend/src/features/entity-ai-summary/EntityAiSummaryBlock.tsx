import type { ReactNode } from 'react';

import { CircleAlert } from 'lucide-react';

import type { SummaryStatus } from '@/features/ideas/api/idea-form-api.types';

import { AiSummarySkeleton } from './AiSummarySkeleton';

type EntityAiSummaryBlockProps = {
  aiSummary: string | null;
  summaryStatus: SummaryStatus | null;
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
}: EntityAiSummaryBlockProps) {
  if (!summaryStatus || summaryStatus === 'SKIPPED') {
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
