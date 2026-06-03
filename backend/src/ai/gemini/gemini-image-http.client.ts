import type { GenerateImageInput } from '../types/generate-image.types';
import { buildGeminiImagePrompt } from './gemini-image-prompt.util';
import { GEMINI_API_BASE_URL } from './gemini.constants';

type GenerateImageRequest = {
  apiKey: string;
  model: string;
  input: GenerateImageInput;
  signal: AbortSignal;
};

export function postGeminiGenerateImage({
  apiKey,
  model,
  input,
  signal,
}: GenerateImageRequest): Promise<Response> {
  const url = `${GEMINI_API_BASE_URL}/models/${model}:generateContent`;

  const generationConfig: Record<string, unknown> = {
    responseModalities: ['TEXT', 'IMAGE'],
  };

  if (input.aspectRatio) {
    generationConfig.imageConfig = { aspectRatio: input.aspectRatio };
  }

  const body = {
    contents: [
      {
        parts: [{ text: buildGeminiImagePrompt(input) }],
      },
    ],
    generationConfig,
  };

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
    signal,
  });
}
