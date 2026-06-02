import type { IdeaPrefillInput } from '../types/ai.types';
import { buildGeminiPrefillPrompt } from './gemini-prompt.util';
import { GEMINI_API_BASE_URL } from './gemini.constants';

type GenerateContentRequest = {
  apiKey: string;
  model: string;
  input: IdeaPrefillInput;
  jsonMode: boolean;
  signal: AbortSignal;
};

export function postGeminiGenerateContent({
  apiKey,
  model,
  input,
  jsonMode,
  signal,
}: GenerateContentRequest): Promise<Response> {
  const url = `${GEMINI_API_BASE_URL}/models/${model}:generateContent`;

  const body: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: buildGeminiPrefillPrompt(input) }],
      },
    ],
  };

  if (jsonMode) {
    body.generationConfig = { responseMimeType: 'application/json' };
  }

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
