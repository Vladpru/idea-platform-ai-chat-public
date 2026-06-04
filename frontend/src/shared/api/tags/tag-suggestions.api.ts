import { TAGS_ROUTES } from '@/shared/api/tags/tags.routes';
import type {
  TagSuggestionsParams,
  TagSuggestionsResponse,
} from '@/shared/api/tags/tags.types';

import { api } from '@/shared/api/http';

export async function fetchTagSuggestions(
  params: TagSuggestionsParams,
): Promise<TagSuggestionsResponse> {
  const { data } = await api.get<TagSuggestionsResponse>(
    TAGS_ROUTES.suggestions,
    { params },
  );
  return data;
}
