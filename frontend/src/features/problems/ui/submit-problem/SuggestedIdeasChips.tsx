import type { SuggestedIdeaChip } from '@/features/problems/lib/submit-problem/suggested-ideas';

import {
  SuggestionChip,
  SuggestionChipGroup,
  SuggestionGroupLabel,
  SuggestionsLoadingMessage,
} from '@/shared/ui';

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
    return <SuggestionsLoadingMessage />;
  }

  if (ideas.length === 0) {
    return null;
  }

  const selectedIdSet = new Set(selectedIds);

  return (
    <SuggestionChipGroup
      className="mt-4"
      label={<SuggestionGroupLabel>Suggested ideas:</SuggestionGroupLabel>}
    >
      {ideas.map(idea => (
        <SuggestionChip
          key={idea.id}
          label={idea.label}
          selected={selectedIdSet.has(idea.id)}
          onClick={() => onToggle(idea.id)}
        />
      ))}
    </SuggestionChipGroup>
  );
}
