'use client';

import { toSimilarProblemCard } from '@/features/problem-details/model/problem-details.mapper';
import { SimilarProblemsWidget } from '@/features/problem-details/ui/similar/SimilarProblemsWidget';
import { useSubmitSimilarProblems } from '@/features/problems/hooks/use-submit-similar-problems';
import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';
import { StarsIcon } from '@/shared/ui/icons';

type SimilarProblemsSectionProps = {
  title?: string;
  description?: string;
  excludeProblemId?: string;
};

export function SimilarProblemsSection({
  title,
  description,
  excludeProblemId,
}: SimilarProblemsSectionProps) {
  const hasSearchInput =
    (title?.trim().length ?? 0) > 0 || (description?.trim().length ?? 0) > 0;

  const { similarProblems: problems, isLoading } = useSubmitSimilarProblems({
    title,
    description,
    excludeProblemId,
    enabled: hasSearchInput,
  });

  const similarProblems = useMemo(
    () => problems.map(toSimilarProblemCard),
    [problems],
  );

  if (!hasSearchInput) {
    return (
      <section
        className="border-brand-gray-200 space-y-3 border-t pt-8"
        aria-label="Similar problems"
      >
        <div className="flex items-center gap-2">
          <StarsIcon className="text-brand-gray-900 size-5 sm:size-6" />
          <h2 className="text-brand-gray-950 font-arial text-lg font-bold tracking-tight uppercase sm:text-xl">
            Similar problems
          </h2>
        </div>
        <p className="text-brand-gray-500 text-sm">
          Add a title or description to see related problems you may want to
          link instead of creating a duplicate.
        </p>
      </section>
    );
  }

  return (
    <SimilarProblemsWidget
      similarProblems={similarProblems}
      isLoading={isLoading}
      className={cn('border-brand-gray-200 border-t pt-8')}
    />
  );
}
