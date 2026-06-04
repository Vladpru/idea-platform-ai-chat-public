import { GoogleGenAI } from '@google/genai';
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
  parseGeminiRetryAfterSeconds,
} from './gemini/gemini-error.util';
import {
  normalizeIdeaPrefillResponse,
  parseGeminiJsonResponse,
} from './gemini/gemini-response.util';
import { generateGeminiPrefillContent } from './gemini/gemini.client';
import {
  DEFAULT_GEMINI_MODEL,
  buildModelsToTry,
} from './gemini/gemini.constants';
import type {
  AiProvider,
  IdeaPrefillInput,
  IdeaPrefillOutput,
} from './types/ai.types';

@Injectable()
export class GeminiService implements AiProvider {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  private readonly apiKey: string;
  private readonly configuredModel: string;
  private readonly timeoutMs: number;
  private readonly isDevelopment: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY').trim();
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
    this.configuredModel =
      this.config.get<string>('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;
    this.timeoutMs = Number(
      this.config.get<string>('GEMINI_TIMEOUT_MS') ?? '10000',
    );
    this.isDevelopment =
      (this.config.get<string>('NODE_ENV') ?? 'development') === 'development';

    if (!this.apiKey.startsWith('AIza')) {
      this.logger.warn(
        'GEMINI_API_KEY does not look like a Google AI Studio key (expected prefix AIza). ' +
          'Create one at https://aistudio.google.com/apikey',
      );
    }
  }

  async generateIdeaPrefill(
    input: IdeaPrefillInput,
  ): Promise<IdeaPrefillOutput> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.generateWithModelFallback(input, controller.signal);
    } catch (error) {
      if (this.isKnownHttpError(error)) {
        throw error;
      }

      this.logger.error('Gemini prefill generation failed', error);
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException('AI generation timed out');
      }
      throw new InternalServerErrorException('Unable to generate AI draft');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async generateWithModelFallback(
    input: IdeaPrefillInput,
    signal: AbortSignal,
  ): Promise<IdeaPrefillOutput> {
    let lastProviderMessage = 'Unknown provider error';
    let lastStatus = 502;
    let lastQuotaMessage: string | undefined;
    let retryAfterSeconds: number | undefined;

    for (const model of buildModelsToTry(this.configuredModel)) {
      let result: Awaited<ReturnType<GeminiService['tryModel']>>;
      try {
        result = await this.tryModel(model, input, signal, {
          lastProviderMessage,
          lastStatus,
          lastQuotaMessage,
          retryAfterSeconds,
        });
      } catch (error) {
        if (this.isAbortError(error)) {
          throw error;
        }
        throw error;
      }

      if (result.kind === 'success') {
        return result.data;
      }

      lastProviderMessage = result.lastProviderMessage;
      lastStatus = result.lastStatus;
      lastQuotaMessage = result.lastQuotaMessage;
      retryAfterSeconds = result.retryAfterSeconds;

      if (result.kind === 'fatal') {
        throw createGeminiProviderException(
          lastStatus,
          lastProviderMessage,
          this.isDevelopment,
        );
      }
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

  private async tryModel(
    model: string,
    input: IdeaPrefillInput,
    signal: AbortSignal,
    state: {
      lastProviderMessage: string;
      lastStatus: number;
      lastQuotaMessage?: string;
      retryAfterSeconds?: number;
    },
  ): Promise<
    | { kind: 'success'; data: IdeaPrefillOutput }
    | {
        kind: 'retry' | 'fatal';
        lastProviderMessage: string;
        lastStatus: number;
        lastQuotaMessage?: string;
        retryAfterSeconds?: number;
      }
  > {
    const attempts: Array<{ jsonMode: boolean }> = [
      { jsonMode: true },
      { jsonMode: false },
    ];

    let lastProviderMessage = state.lastProviderMessage;
    let lastStatus = state.lastStatus;
    let lastQuotaMessage = state.lastQuotaMessage;
    let retryAfterSeconds = state.retryAfterSeconds;

    for (const attempt of attempts) {
      const response = await generateGeminiPrefillContent({
        client: this.client,
        model,
        input,
        jsonMode: attempt.jsonMode,
        signal,
      });

      if (response.ok) {
        if (!response.text) {
          throw new InternalServerErrorException(
            'AI returned an empty response',
          );
        }

        const parsed = parseGeminiJsonResponse(response.text);
        return {
          kind: 'success',
          data: normalizeIdeaPrefillResponse(parsed, input),
        };
      }

      lastProviderMessage = response.message;
      lastStatus = response.status;
      this.logger.error(
        `Gemini request failed (model=${model}, jsonMode=${attempt.jsonMode}, status=${response.status}): ${lastProviderMessage}`,
      );

      if (isGeminiQuotaExceeded(response.status, lastProviderMessage)) {
        lastQuotaMessage = lastProviderMessage;
        retryAfterSeconds = parseGeminiRetryAfterSeconds(lastProviderMessage);
        return {
          kind: 'retry',
          lastProviderMessage,
          lastStatus,
          lastQuotaMessage,
          retryAfterSeconds,
        };
      }

      if (response.status === 400 && attempt.jsonMode) {
        continue;
      }
      if (response.status === 404) {
        return {
          kind: 'retry',
          lastProviderMessage,
          lastStatus,
          lastQuotaMessage,
          retryAfterSeconds,
        };
      }

      return {
        kind: 'fatal',
        lastProviderMessage,
        lastStatus,
        lastQuotaMessage,
        retryAfterSeconds,
      };
    }

    return {
      kind: 'retry',
      lastProviderMessage,
      lastStatus,
      lastQuotaMessage,
      retryAfterSeconds,
    };
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
