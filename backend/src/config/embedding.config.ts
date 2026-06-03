import { registerAs } from '@nestjs/config';

export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-2';
export const DEFAULT_EMBEDDING_TIMEOUT_MS = 15_000;
export const EMBEDDING_DIMENSIONS = 768;

export default registerAs('embedding', () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  return {
    apiKey,
    model: DEFAULT_EMBEDDING_MODEL,
    timeoutMs: DEFAULT_EMBEDDING_TIMEOUT_MS,
    dimensions: EMBEDDING_DIMENSIONS,
  };
});
