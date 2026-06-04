import { registerAs } from '@nestjs/config';

export const SIMILARITY_RRF_K = 60;
export const SIMILARITY_CANDIDATE_LIMIT = 20;
export const SIMILARITY_EMBEDDING_CACHE_MAX_SIZE = 500;
export const SIMILARITY_EMBEDDING_CACHE_TTL_MS = 900_000;

export default registerAs('similarity', () => ({
  rrfK: SIMILARITY_RRF_K,
  candidateLimit: SIMILARITY_CANDIDATE_LIMIT,
  embeddingCacheMaxSize: SIMILARITY_EMBEDDING_CACHE_MAX_SIZE,
  embeddingCacheTtlMs: SIMILARITY_EMBEDDING_CACHE_TTL_MS,
}));
