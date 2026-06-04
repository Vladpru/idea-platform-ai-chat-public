import type { SimilarProblemCard } from '@/features/problem-details/model/problem-details.types';
import { SimilarProblemsListSkeleton } from '@/features/problem-details/ui/skeletons/SimilarProblemsListSkeleton';

import { cn } from '@/shared/lib/utils';
import { StarsIcon } from '@/shared/ui/icons';

import { SimilarProblemCard as SimilarProblemCardUi } from './SimilarProblemCard';

type SimilarProblemsWidgetProps = {
  similarProblems: SimilarProblemCard[];
  isLoading: boolean;
  className?: string;
};

export function SimilarProblemsWidget({
  similarProblems,
  isLoading,
  className,
}: SimilarProblemsWidgetProps) {
  const showEmpty = !isLoading && similarProblems.length === 0;

  return (
    <section
      className={cn('space-y-6 pt-10', className)}
      aria-label="Similar problems"
    >
      <div className="flex items-center gap-2">
        <StarsIcon className="text-brand-gray-900 size-5 sm:size-6" />
        <h2 className="text-brand-gray-950 font-arial text-lg font-bold tracking-tight uppercase sm:text-xl">
          Similar problems
        </h2>
      </div>

      {isLoading ? (
        <SimilarProblemsListSkeleton />
      ) : showEmpty ? (
        <div className="border-brand-gray-200 text-brand-gray-600 bg-card rounded-lg border border-dashed px-6 py-12 text-center">
          <p className="text-sm font-semibold tracking-wide uppercase">
            No similar problems yet
          </p>
          <p className="text-brand-gray-500 mx-auto mt-2 max-w-sm text-sm">
            Other published problems will appear here when available.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {similarProblems.map(card => (
            <SimilarProblemCardUi key={card.id} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}
