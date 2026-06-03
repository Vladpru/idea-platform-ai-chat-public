import {
  GatewayTimeoutException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  GenerateImageInput,
  GenerateImageOutput,
} from '../../ai/types/generate-image.types';
import {
  createDeapiProviderException,
  createDeapiRateLimitException,
  parseDeapiErrorMessage,
} from './deapi-error.util';
import {
  getDeapiRequestStatus,
  postDeapiPromptImage,
  postDeapiTxt2Img,
} from './deapi-http.client';
import { buildDeapiImagePrompt } from './deapi-image-prompt.util';
import {
  DEAPI_ASPECT_RATIO_DIMENSIONS,
  DEAPI_DEFAULT_ASPECT_RATIO,
  DEAPI_DEFAULT_NEGATIVE_PROMPT,
  DEAPI_FLUX_SCHNELL_GUIDANCE,
  DEAPI_FLUX_SCHNELL_MODEL,
  DEAPI_FLUX_SCHNELL_STEPS,
  DEFAULT_DEAPI_BASE_URL,
} from './deapi.constants';
import type {
  DeapiPromptImageResponse,
  DeapiRequestStatusResponse,
  DeapiTxt2ImgResponse,
} from './deapi.types';

const DEFAULT_IMAGE_TIMEOUT_MS = 120_000;
const DEFAULT_POLL_INTERVAL_MS = 2_000;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

@Injectable()
export class DeapiImageService {
  private readonly logger = new Logger(DeapiImageService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly usePromptEnhancement: boolean;
  private readonly isDevelopment: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('DEAPI_API_KEY').trim();
    this.baseUrl =
      this.config.get<string>('DEAPI_BASE_URL')?.trim() ||
      DEFAULT_DEAPI_BASE_URL;
    this.model =
      this.config.get<string>('DEAPI_IMAGE_MODEL')?.trim() ||
      DEAPI_FLUX_SCHNELL_MODEL;
    this.timeoutMs = parsePositiveInt(
      this.config.get<string>('DEAPI_IMAGE_TIMEOUT_MS'),
      DEFAULT_IMAGE_TIMEOUT_MS,
    );
    this.pollIntervalMs = parsePositiveInt(
      this.config.get<string>('DEAPI_POLL_INTERVAL_MS'),
      DEFAULT_POLL_INTERVAL_MS,
    );
    this.usePromptEnhancement =
      (this.config.get<string>('DEAPI_USE_PROMPT_ENHANCEMENT') ?? 'true') !==
      'false';
    this.isDevelopment =
      (this.config.get<string>('NODE_ENV') ?? 'development') === 'development';
  }

  async generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const basePrompt = buildDeapiImagePrompt(input);
      const { prompt, negativePrompt } = await this.resolvePrompts(
        basePrompt,
        controller.signal,
      );

      const aspectRatio = input.aspectRatio ?? DEAPI_DEFAULT_ASPECT_RATIO;
      const { width, height } = DEAPI_ASPECT_RATIO_DIMENSIONS[aspectRatio];

      const requestId = await this.submitTxt2Img(
        {
          prompt,
          negative_prompt: negativePrompt,
          model: this.model,
          width,
          height,
          guidance: DEAPI_FLUX_SCHNELL_GUIDANCE,
          steps: DEAPI_FLUX_SCHNELL_STEPS,
          seed: Math.floor(Math.random() * 2_147_483_647),
        },
        controller.signal,
      );

      const resultUrl = await this.pollForResultUrl(
        requestId,
        controller.signal,
      );
      return this.downloadImageAsBase64(resultUrl, controller.signal);
    } catch (error) {
      if (this.isKnownHttpError(error)) {
        throw error;
      }

      this.logger.error('deAPI image generation failed', error);
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException('AI image generation timed out');
      }
      throw new InternalServerErrorException('Unable to generate AI image');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async resolvePrompts(
    basePrompt: string,
    signal: AbortSignal,
  ): Promise<{ prompt: string; negativePrompt: string }> {
    if (!this.usePromptEnhancement) {
      return {
        prompt: basePrompt,
        negativePrompt: DEAPI_DEFAULT_NEGATIVE_PROMPT,
      };
    }

    const response = await postDeapiPromptImage(this.apiKey, basePrompt, {
      baseUrl: this.baseUrl,
      negativePrompt: DEAPI_DEFAULT_NEGATIVE_PROMPT,
      signal,
    });

    if (!response.ok) {
      await this.throwForResponse(response);
    }

    const payload = (await response.json()) as DeapiPromptImageResponse;
    return {
      prompt: payload.prompt?.trim() || basePrompt,
      negativePrompt:
        payload.negative_prompt?.trim() || DEAPI_DEFAULT_NEGATIVE_PROMPT,
    };
  }

  private async submitTxt2Img(
    body: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<string> {
    const response = await postDeapiTxt2Img(this.apiKey, body, {
      baseUrl: this.baseUrl,
      signal,
    });

    if (!response.ok) {
      await this.throwForResponse(response);
    }

    const payload = (await response.json()) as DeapiTxt2ImgResponse;
    const requestId = payload.data?.request_id?.trim();
    if (!requestId) {
      throw new InternalServerErrorException('deAPI returned no request id');
    }

    return requestId;
  }

  private async pollForResultUrl(
    requestId: string,
    signal: AbortSignal,
  ): Promise<string> {
    while (!signal.aborted) {
      const response = await getDeapiRequestStatus(this.apiKey, requestId, {
        baseUrl: this.baseUrl,
        signal,
      });

      if (!response.ok) {
        await this.throwForResponse(response);
      }

      const payload = (await response.json()) as DeapiRequestStatusResponse;
      const status = payload.data?.status;

      if (status === 'done') {
        const resultUrl = payload.data?.result_url?.trim();
        if (!resultUrl) {
          throw new InternalServerErrorException('deAPI returned no image URL');
        }
        return resultUrl;
      }

      if (status === 'error') {
        const message = payload.message?.trim() || 'deAPI image job failed';
        throw createDeapiProviderException(502, message, this.isDevelopment);
      }

      await this.sleep(this.pollIntervalMs, signal);
    }

    throw new GatewayTimeoutException('AI image generation timed out');
  }

  private async downloadImageAsBase64(
    resultUrl: string,
    signal: AbortSignal,
  ): Promise<GenerateImageOutput> {
    const response = await fetch(resultUrl, { signal });
    if (!response.ok) {
      throw createDeapiProviderException(
        response.status,
        `Failed to download generated image (${response.status})`,
        this.isDevelopment,
      );
    }

    const mimeType =
      response.headers.get('content-type')?.split(';')[0]?.trim() ||
      'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      throw new InternalServerErrorException('deAPI returned an empty image');
    }

    return {
      base64: buffer.toString('base64'),
      mimeType,
    };
  }

  private async throwForResponse(response: Response): Promise<never> {
    const errorBody = await response.text();
    const message = parseDeapiErrorMessage(errorBody);
    this.logger.error(
      `deAPI request failed (status=${response.status}): ${message}`,
    );

    if (response.status === 429) {
      throw createDeapiRateLimitException(message, this.isDevelopment);
    }

    throw createDeapiProviderException(
      response.status,
      message,
      this.isDevelopment,
    );
  }

  private sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', onAbort);
        reject(this.toAbortError(signal.reason));
      };
      const timeoutId = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort);
    });
  }

  private toAbortError(reason: unknown): Error {
    if (reason instanceof Error) {
      return reason;
    }

    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    return abortError;
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
