import { SimilarProblemCardSkeleton } from './SimilarProblemCardSkeleton';

const CARD_KEYS = ['similar-problem-1', 'similar-problem-2'] as const;

export function SimilarProblemsListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {CARD_KEYS.map(key => (
        <SimilarProblemCardSkeleton key={key} />
      ))}
    </div>
  );
}
