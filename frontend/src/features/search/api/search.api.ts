import { api } from '@/shared/api/http';

import type { GlobalSearchResultResponse, SearchTab } from './search.types';

export interface SearchParams {
  q: string;
  page: number;
  limit: number;
  activeTab: SearchTab;
}

export async function fetchSearchResults(
  params: SearchParams,
): Promise<GlobalSearchResultResponse> {
  const { data } = await api.get<GlobalSearchResultResponse>('/search', {
    params,
  });
  return data;
}
