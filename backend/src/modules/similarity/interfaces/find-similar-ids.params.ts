export type SimilarityEntityType = 'idea' | 'problem';

export interface FindSimilarIdsParams {
  entityType: SimilarityEntityType;
  vectorLiteral: string;
  vectorAvailable: boolean;
  ftsText: string;
  excludeId: string | null;
  limit: number;
}
