import {
  GatewayTimeoutException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  createGeminiProviderException,
  createGeminiQuotaException,
  isGeminiQuotaExceeded,
  parseGeminiProviderErrorMessage,
  parseGeminiRetryAfterSeconds,
} from './gemini/gemini-error.util';
import { postGeminiGenerateImage } from './gemini/gemini-image-http.client';
import { requireGeminiImage } from './gemini/gemini-image-response.util';
import {
  DEFAULT_GEMINI_IMAGE_MODEL,
  buildImageModelsToTry,
} from './gemini/gemini.constants';
import type { GeminiGenerateContentResponse } from './gemini/gemini.types';
import type {
  GenerateImageInput,
  GenerateImageOutput,
} from './types/generate-image.types';

@Injectable()
export class GeminiImageService {
  private readonly logger = new Logger(GeminiImageService.name);
  private readonly apiKey: string;
  private readonly configuredImageModel: string;
  private readonly imageTimeoutMs: number;
  private readonly isDevelopment: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY').trim();
    this.configuredImageModel =
      this.config.get<string>('GEMINI_IMAGE_MODEL')?.trim() ||
      DEFAULT_GEMINI_IMAGE_MODEL;
    this.imageTimeoutMs = Number(
      this.config.get<string>('GEMINI_IMAGE_TIMEOUT_MS') ?? '60000',
    );
    this.isDevelopment =
      (this.config.get<string>('NODE_ENV') ?? 'development') === 'development';
  }

  async generateContentImage(
    input: GenerateImageInput,
  ): Promise<GenerateImageOutput> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.imageTimeoutMs);

    try {
      return await this.generateImageWithModelFallback(
        input,
        controller.signal,
      );
    } catch (error) {
      if (this.isKnownHttpError(error)) {
        throw error;
      }

      this.logger.error('Gemini image generation failed', error);
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException('AI image generation timed out');
      }
      throw new InternalServerErrorException('Unable to generate AI image');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async generateImageWithModelFallback(
    input: GenerateImageInput,
    signal: AbortSignal,
  ): Promise<GenerateImageOutput> {
    let lastProviderMessage = 'Unknown provider error';
    let lastStatus = 502;
    let lastQuotaMessage: string | undefined;
    let retryAfterSeconds: number | undefined;

    for (const model of buildImageModelsToTry(this.configuredImageModel)) {
      const response = await postGeminiGenerateImage({
        apiKey: this.apiKey,
        model,
        input,
        signal,
      });

      if (response.ok) {
        const payload =
          (await response.json()) as GeminiGenerateContentResponse;
        return requireGeminiImage(payload);
      }

      const errorBody = await response.text();
      lastProviderMessage = parseGeminiProviderErrorMessage(errorBody);
      lastStatus = response.status;
      this.logger.error(
        `Gemini image request failed (model=${model}, status=${response.status}): ${lastProviderMessage}`,
      );

      if (isGeminiQuotaExceeded(response.status, lastProviderMessage)) {
        lastQuotaMessage = lastProviderMessage;
        retryAfterSeconds = parseGeminiRetryAfterSeconds(lastProviderMessage);
        continue;
      }

      if (response.status === 404) {
        continue;
      }

      throw createGeminiProviderException(
        lastStatus,
        lastProviderMessage,
        this.isDevelopment,
      );
    }

    if (lastQuotaMessage) {
      throw createGeminiQuotaException(lastQuotaMessage, {
        isDevelopment: this.isDevelopment,
        retryAfterSeconds,
      });
    }

    throw createGeminiProviderException(
      lastStatus,
      lastProviderMessage,
      this.isDevelopment,
    );
  }

  private isAbortError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'AbortError'
    );
  }

  private isKnownHttpError(error: unknown): boolean {
    return error instanceof HttpException;
  }
}
