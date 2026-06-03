import { InternalServerErrorException } from '@nestjs/common';

import type { GenerateImageOutput } from '../types/generate-image.types';
import type { GeminiGenerateContentResponse } from './gemini.types';

export function extractGeminiImage(
  payload: GeminiGenerateContentResponse,
): GenerateImageOutput | null {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    const data = part.inlineData?.data?.trim();
    if (!data) continue;

    return {
      base64: data,
      mimeType: part.inlineData?.mimeType?.trim() || 'image/png',
    };
  }

  return null;
}

export function requireGeminiImage(
  payload: GeminiGenerateContentResponse,
): GenerateImageOutput {
  const image = extractGeminiImage(payload);
  if (!image) {
    throw new InternalServerErrorException('AI returned no image data');
  }
  return image;
}
