import type { SuggestedIdeaChip } from '@/features/problems/lib/submit-problem/suggested-ideas';

import { cn } from '@/shared/lib/utils';

type SuggestedIdeasChipsProps = {
  ideas: SuggestedIdeaChip[];
  selectedIds: string[];
  onToggle: (ideaId: string) => void;
  isLoading?: boolean;
};

export function SuggestedIdeasChips({
  ideas,
  selectedIds,
  onToggle,
  isLoading = false,
}: SuggestedIdeasChipsProps) {
  if (isLoading) {
    return (
      <p className="text-brand-gray-500 mt-4 text-sm">Loading suggestions…</p>
    );
  }

  if (ideas.length === 0) {
    return null;
  }

  const selectedIdSet = new Set(selectedIds);

  return (
    <div className="mt-4">
      <p className="text-brand-gray-600 text-xs font-semibold tracking-wide uppercase">
        Suggested ideas
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ideas.map(idea => {
          const isSelected = selectedIdSet.has(idea.id);

          return (
            <button
              key={idea.id}
              type="button"
              onClick={() => onToggle(idea.id)}
              aria-pressed={isSelected}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                isSelected
                  ? 'border-brand-dark-blue bg-brand-light-blue/35 text-brand-dark-blue'
                  : 'border-brand-gray-200 text-brand-gray-900 hover:border-brand-dark-blue hover:bg-brand-light-blue/15 bg-white',
              )}
            >
              {idea.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
