import { InternalServerErrorException, Logger } from '@nestjs/common';

import type { IdeaPrefillInput, IdeaPrefillOutput } from '../types/ai.types';

const logger = new Logger('GeminiResponse');

export function parseGeminiJsonResponse(raw: string): unknown {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    logger.warn('Gemini returned non-JSON output');
    throw new InternalServerErrorException(
      'AI returned invalid response format',
    );
  }
}

export function normalizeIdeaPrefillResponse(
  parsed: unknown,
  input: IdeaPrefillInput,
): IdeaPrefillOutput {
  const source = parsed as Partial<IdeaPrefillOutput> | null;
  const title =
    (source?.title ?? '').toString().trim() ||
    input.title?.trim() ||
    'Untitled idea';
  const description =
    (source?.description ?? '').toString().trim() ||
    input.description?.trim() ||
    input.userPrompt.trim();
  const problemStatement =
    (source?.problemStatement ?? '').toString().trim() ||
    input.userPrompt.trim();
  const tags = Array.isArray(source?.tags)
    ? source.tags
        .map(tag => String(tag).trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  return {
    title,
    description,
    problemStatement,
    tags,
  };
}
