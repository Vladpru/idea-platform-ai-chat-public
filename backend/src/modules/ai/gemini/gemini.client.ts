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
  | { ok: true; text: string; inputTokens?: number; outputTokens?: number }
  | { ok: false; status: number; message: string };

export async function generateGeminiJsonContent({
  client,
  model,
  prompt,
  jsonMode,
  signal,
}: {
  client: GoogleGenAI;
  model: string;
  prompt: string;
  jsonMode: boolean;
  signal: AbortSignal;
}): Promise<GeminiGenerateContentResult> {
  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        abortSignal: signal,
      },
    });

    return {
      ok: true,
      text: response.text?.trim() ?? '',
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, status: error.status, message: error.message };
    }
    throw error;
  }
}

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

    return {
      ok: true,
      text: response.text?.trim() ?? '',
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, status: error.status, message: error.message };
    }
    throw error;
  }
}

export type GeminiStreamResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

export async function streamGeminiContent({
  client,
  model,
  prompt,
  signal,
  onToken,
}: {
  client: GoogleGenAI;
  model: string;
  prompt: string;
  signal?: AbortSignal;
  onToken: (token: string) => void;
}): Promise<GeminiStreamResult> {
  let tokensEmitted = 0;
  try {
    const stream = await client.models.generateContentStream({
      model,
      contents: prompt,
      config: { abortSignal: signal },
    });

    for await (const chunk of stream) {
      const text = chunk.text ?? '';
      if (text) {
        tokensEmitted++;
        onToken(text);
      }
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError && tokensEmitted === 0) {
      return { ok: false, status: error.status, message: error.message };
    }
    throw error;
  }
}
