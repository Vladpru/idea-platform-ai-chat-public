import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import type { ProblemForm } from '@/features/problems/api/problems-api.types';

import { api } from '@/shared/api/http';

const SIMILARITY_ROUTE = '/similarity';

export type SimilarityEntityType = 'idea' | 'problem';

export type FetchSimilarItemsParams = {
  entityType: SimilarityEntityType;
  limit?: number;
  sourceId?: string;
  text?: string;
};

export async function fetchSimilarItems(
  params: FetchSimilarItemsParams & { entityType: 'idea' },
): Promise<IdeaFormResponseDto[]>;
export async function fetchSimilarItems(
  params: FetchSimilarItemsParams & { entityType: 'problem' },
): Promise<ProblemForm[]>;
export async function fetchSimilarItems(
  params: FetchSimilarItemsParams,
): Promise<IdeaFormResponseDto[] | ProblemForm[]> {
  const { data } = await api.get<IdeaFormResponseDto[] | ProblemForm[]>(
    SIMILARITY_ROUTE,
    { params },
  );
  return data;
}
