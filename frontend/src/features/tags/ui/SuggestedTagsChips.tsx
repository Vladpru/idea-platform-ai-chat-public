import {
  getSelectedTagNames,
  toggleTagInValue,
  type SuggestedTagChip,
} from '@/features/tags/lib/tag-suggestions';

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
  hasSearchInput?: boolean;
};

export function SuggestedTagsChips({
  tags,
  tagsValue,
  onTagsChange,
  isLoading = false,
  hasSearchInput = true,
}: SuggestedTagsChipsProps) {
  if (!hasSearchInput) {
    return null;
  }

  if (isLoading) {
    return <SuggestionsLoadingMessage />;
  }

  const selectedNames = getSelectedTagNames(tagsValue);
  const selectedNameSet = new Set(selectedNames.map(name => name.toLowerCase()));
  const visibleTags = tags.filter(
    tag => !selectedNameSet.has(tag.name.toLowerCase()),
  );

  if (visibleTags.length === 0) {
    return null;
  }

  return (
    <SuggestionChipGroup
      className="mt-4"
      label={
        <SuggestionGroupLabel>Suggested tags:</SuggestionGroupLabel>
      }
    >
      {visibleTags.map(tag => (
        <SuggestionChip
          key={tag.name}
          label={tag.label}
          tier={tag.tier}
          selected={false}
          onClick={() => onTagsChange(toggleTagInValue(tagsValue, tag.name))}
        />
      ))}
    </SuggestionChipGroup>
  );
}
