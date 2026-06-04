export type TagSuggestionContext = 'idea' | 'problem';

export type TagSuggestionSource = 'catalog' | 'embedding' | 'ai';

export type TagSuggestionTier = 'strong' | 'suggested' | 'speculative';

export type RankedTagCandidate = {
  name: string;
  label: string;
  score: number;
  sources: TagSuggestionSource[];
};

export type SuggestedTagItem = {
  name: string;
  label: string;
  tier: TagSuggestionTier;
  sources: TagSuggestionSource[];
};

export type SuggestTagsInput = {
  title?: string;
  description?: string;
  exclude?: string[];
  limit?: number;
  context?: TagSuggestionContext;
};

export type SuggestTagsResponse = {
  data: SuggestedTagItem[];
};

export const MIN_TAG_SUGGESTION_CONTENT_LENGTH = 20;

export const DEFAULT_TAG_SUGGESTION_LIMIT = 6;

export const AI_KNOWN_TAGS_LIMIT = 100;
