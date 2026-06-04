import { ApiError, GoogleGenAI } from '@google/genai';

import type { IdeaPrefillInput } from '../types/ai.types';
import { buildGeminiPrefillPrompt } from './gemini-prompt.util';

export type GeminiGenerateContentRequest = {
  client: GoogleGenAI;
  model: string;
  input: IdeaPrefillInput;
  jsonMode: boolean;
  signal: AbortSignal;
};

export type GeminiGenerateContentResult =
  | { ok: true; text: string }
  | { ok: false; status: number; message: string };

export async function generateGeminiPrefillContent({
  client,
  model,
  input,
  jsonMode,
  signal,
}: GeminiGenerateContentRequest): Promise<GeminiGenerateContentResult> {
  try {
    const response = await client.models.generateContent({
      model,
      contents: buildGeminiPrefillPrompt(input),
      config: {
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        abortSignal: signal,
      },
    });

    return { ok: true, text: response.text?.trim() ?? '' };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, status: error.status, message: error.message };
    }
    throw error;
  }
}
