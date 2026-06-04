export type TagListItem = {
  id: string;
  name: string;
  label: string | null;
};

export type TagSuggestionTier = 'strong' | 'suggested' | 'speculative';

export type TagSuggestionSource = 'catalog' | 'embedding' | 'ai';

export type TagSuggestionItem = {
  name: string;
  label: string;
  tier: TagSuggestionTier;
  sources: TagSuggestionSource[];
};

export type TagSuggestionsParams = {
  title?: string;
  description?: string;
  exclude?: string[];
  limit?: number;
  context?: 'idea' | 'problem';
};

export type TagSuggestionsResponse = {
  data: TagSuggestionItem[];
};
