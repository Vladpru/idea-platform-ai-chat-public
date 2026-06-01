import {
  getSelectedTagNames,
  toggleTagInValue,
  type SuggestedTagChip,
} from '@/features/problems/lib/submit-problem/suggested-tags';

import {
  SuggestionChip,
  SuggestionChipGroup,
  SuggestionGroupLabel,
  SuggestionsLoadingMessage,
} from '@/shared/ui';

type SuggestedTagsChipsProps = {
  tags: SuggestedTagChip[];
  tagsValue: string;
  onTagsChange: (value: string) => void;
  isLoading?: boolean;
};

export function SuggestedTagsChips({
  tags,
  tagsValue,
  onTagsChange,
  isLoading = false,
}: SuggestedTagsChipsProps) {
  if (isLoading) {
    return <SuggestionsLoadingMessage />;
  }

  if (tags.length === 0) {
    return null;
  }

  const selectedNames = getSelectedTagNames(tagsValue);
  const selectedNameSet = new Set(selectedNames.map(name => name.toLowerCase()));

  return (
    <SuggestionChipGroup
      className="mt-4"
      label={<SuggestionGroupLabel>Suggested tags:</SuggestionGroupLabel>}
    >
      {tags.map(tag => (
        <SuggestionChip
          key={tag.name}
          label={tag.label}
          selected={selectedNameSet.has(tag.name.toLowerCase())}
          onClick={() => onTagsChange(toggleTagInValue(tagsValue, tag.name))}
        />
      ))}
    </SuggestionChipGroup>
  );
}
