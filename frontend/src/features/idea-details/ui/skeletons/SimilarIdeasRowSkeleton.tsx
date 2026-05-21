import { SimilarIdeaCardSkeleton } from './SimilarIdeaCardSkeleton';

const CARD_KEYS = ['similar-1', 'similar-2', 'similar-3'] as const;

export function SimilarIdeasRowSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
      aria-hidden
    >
      {CARD_KEYS.map(key => (
        <SimilarIdeaCardSkeleton key={key} />
      ))}
    </div>
  );
}
