import type { SimilarityEntityType } from './find-similar-ids.params';

export interface SimilarityFindParams {
  entityType: SimilarityEntityType;
  limit: number;
  userId: string;
  sourceId?: string;
  text?: string;
}
