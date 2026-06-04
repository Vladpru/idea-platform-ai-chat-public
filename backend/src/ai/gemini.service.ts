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
  normalizeSuggestedTagsResponse,
  parseGeminiJsonResponse,
} from './gemini/gemini-response.util';
import { buildGeminiTagPrompt } from './gemini/gemini-tag-prompt.util';
import {
  generateGeminiJsonContent,
  generateGeminiPrefillContent,
} from './gemini/gemini.client';
import {
  DEFAULT_GEMINI_MODEL,
  buildModelsToTry,
} from './gemini/gemini.constants';
import type {
  AiProvider,
  IdeaPrefillInput,
  IdeaPrefillOutput,
  SuggestTagsInput,
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

  async generateSuggestedTags(input: SuggestTagsInput): Promise<string[]> {
    const enabled =
      (this.config.get<string>('AI_TAG_SUGGESTIONS_ENABLED') ?? 'true')
        .trim()
        .toLowerCase() !== 'false';

    if (!enabled) {
      return [];
    }

    try {
      const prompt = buildGeminiTagPrompt(input);
      const models = buildModelsToTry(this.configuredModel);

      for (const model of models) {
        this.logger.log(`Trying Gemini model for tag-suggestions: ${model}`);

        try {
          const tags = await this.runWithPerModelTimeout(signal =>
            this.tryTagSuggestionsForModel({
              model,
              prompt,
              signal,
            }),
          );
          if (tags !== null) {
            return tags;
          }
        } catch (error) {
          if (this.isAbortError(error)) {
            this.logger.warn(
              `Model ${model} timed out for tag-suggestions, trying next fallback`,
            );
            continue;
          }
          throw error;
        }
      }

      return [];
    } catch (error) {
      this.logger.warn('Gemini tag suggestion failed', error as Error);
      return [];
    }
  }

  async generateIdeaPrefill(
    input: IdeaPrefillInput,
  ): Promise<IdeaPrefillOutput> {
    try {
      return await this.generateWithModelFallback(input);
    } catch (error) {
      if (this.isKnownHttpError(error)) {
        throw error;
      }

      this.logger.error('Gemini prefill generation failed', error);
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException('AI generation timed out');
      }
      throw new InternalServerErrorException('Unable to generate AI draft');
    }
  }

  private async generateWithModelFallback(
    input: IdeaPrefillInput,
  ): Promise<IdeaPrefillOutput> {
    let lastProviderMessage = 'Unknown provider error';
    let lastStatus = 502;
    let lastQuotaMessage: string | undefined;
    let retryAfterSeconds: number | undefined;

    for (const model of buildModelsToTry(this.configuredModel)) {
      this.logger.log(`Trying Gemini model for idea-prefill: ${model}`);

      let result: Awaited<ReturnType<GeminiService['tryModel']>>;
      try {
        result = await this.runWithPerModelTimeout(signal =>
          this.tryModel(model, input, signal, {
            lastProviderMessage,
            lastStatus,
            lastQuotaMessage,
            retryAfterSeconds,
          }),
        );
      } catch (error) {
        if (this.isAbortError(error)) {
          this.logger.warn(
            `Model ${model} timed out for idea-prefill, trying next fallback`,
          );
          lastProviderMessage = 'Request timed out';
          lastStatus = 504;
          continue;
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

      if (result.kind === 'retry') {
        this.logger.warn(
          `Model ${model} failed (${lastStatus}), trying next fallback`,
        );
        continue;
      }

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
        this.logSuccessfulGeneration('idea-prefill', model, {
          jsonMode: attempt.jsonMode,
        });
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

  private async tryTagSuggestionsForModel({
    model,
    prompt,
    signal,
  }: {
    model: string;
    prompt: string;
    signal: AbortSignal;
  }): Promise<string[] | null> {
    for (const jsonMode of [true, false]) {
      const response = await generateGeminiJsonContent({
        client: this.client,
        model,
        prompt,
        jsonMode,
        signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          break;
        }
        if (isGeminiQuotaExceeded(response.status, response.message)) {
          break;
        }
        continue;
      }

      if (!response.text) {
        continue;
      }

      try {
        const parsed = parseGeminiJsonResponse(response.text);
        const tags = normalizeSuggestedTagsResponse(parsed);
        this.logSuccessfulGeneration('tag-suggestions', model, {
          jsonMode,
          tagCount: tags.length,
        });
        return tags;
      } catch {
        continue;
      }
    }

    return null;
  }

  private async runWithPerModelTimeout<T>(
    operation: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await operation(controller.signal);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private logSuccessfulGeneration(
    operation: 'idea-prefill' | 'tag-suggestions',
    model: string,
    options?: { jsonMode?: boolean; tagCount?: number },
  ): void {
    const details: string[] = [`model=${model}`];
    if (options?.jsonMode !== undefined) {
      details.push(`jsonMode=${options.jsonMode}`);
    }
    if (options?.tagCount !== undefined) {
      details.push(`tagCount=${options.tagCount}`);
    }
    this.logger.log(`Gemini ${operation} succeeded (${details.join(', ')})`);
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
