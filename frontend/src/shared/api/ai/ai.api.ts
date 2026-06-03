import type {
  GenerateAiImagePayload,
  GeneratedAiImageResponse,
} from '@/shared/api/ai/ai-api.types';
import { AI_ROUTES } from '@/shared/api/ai/ai.routes';

import { api } from '@/shared/api/http';

export async function generateAiImage(
  payload: GenerateAiImagePayload,
): Promise<GeneratedAiImageResponse> {
  const { data } = await api.post<{ data: GeneratedAiImageResponse }>(
    AI_ROUTES.generateImage,
    payload,
  );
  return data.data;
}

export type {
  GenerateAiImagePayload,
  GeneratedAiImageResponse,
  ImageAspectRatio,
} from '@/shared/api/ai/ai-api.types';
