import { registerAs } from '@nestjs/config';

export const DEFAULT_SEARCH_MIN_SIMILARITY = 0.65;
export const SEARCH_EMBEDDING_CACHE_MAX_SIZE = 100;
export const SEARCH_EMBEDDING_CACHE_TTL_MS = 5 * 60 * 1000;

export default registerAs('search', () => ({
  minSimilarity: DEFAULT_SEARCH_MIN_SIMILARITY,
  embeddingCacheMaxSize: SEARCH_EMBEDDING_CACHE_MAX_SIZE,
  embeddingCacheTtlMs: SEARCH_EMBEDDING_CACHE_TTL_MS,
}));
