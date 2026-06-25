import { GoogleGenAI } from '@google/genai';
import {
  GatewayTimeoutException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AnalyticsService } from '../../core/analytics/analytics.service';
import {
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from '../../core/config/embedding.config';
import type { EntitySummaryContent } from '../ai-summary/summary.types';
import { buildDocumentExtractPrompt } from './document/document-extract-prompt.util';
import {
  normalizeIdeaDocumentExtractResponse,
  normalizeProblemDocumentExtractResponse,
} from './document/document-extract-response.util';
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
  streamGeminiContent,
} from './gemini/gemini.client';
import {
  DEFAULT_GEMINI_MODEL,
  buildModelsToTry,
} from './gemini/gemini.constants';
import { buildEntitySummaryPrompt } from './gemini/summary-prompt.util';
import {
  type AiProvider,
  DocumentEntityType,
  type DocumentExtractInput,
  type DocumentExtractOutput,
  type IdeaPrefillInput,
  type IdeaPrefillOutput,
  type SuggestTagsInput,
} from './types/ai.types';

const DEFAULT_TAG_SUGGESTIONS_TOTAL_TIMEOUT_MS = 15_000;
const DEFAULT_SUMMARY_TIMEOUT_MS = 15_000;

type GeminiModelFailureOutcome = {
  kind: 'retry' | 'fatal';
  lastProviderMessage: string;
  lastStatus: number;
  lastQuotaMessage?: string;
  retryAfterSeconds?: number;
};

@Injectable()
export class GeminiService implements AiProvider {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  private readonly configuredModel: string;
  private readonly timeoutMs: number;
  private readonly tagSuggestionsTotalTimeoutMs: number;
  private readonly summaryTimeoutMs: number;
  private readonly tagSuggestionsEnabled: boolean;
  private readonly summaryEnabled: boolean;
  private readonly isDevelopment: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly analytics: AnalyticsService,
  ) {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY').trim();
    this.client = new GoogleGenAI({ apiKey });
    this.configuredModel =
      this.config.get<string>('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;

    this.timeoutMs = this.resolveTimeoutMs('GEMINI_TIMEOUT_MS', 10_000);
    this.tagSuggestionsTotalTimeoutMs = this.resolveTimeoutMs(
      'GEMINI_TAG_SUGGESTIONS_TIMEOUT_MS',
      DEFAULT_TAG_SUGGESTIONS_TOTAL_TIMEOUT_MS,
    );
    this.summaryTimeoutMs = this.resolveTimeoutMs(
      'GEMINI_SUMMARY_TIMEOUT_MS',
      DEFAULT_SUMMARY_TIMEOUT_MS,
    );

    this.tagSuggestionsEnabled =
      (this.config.get<string>('AI_TAG_SUGGESTIONS_ENABLED') ?? 'true')
        .trim()
        .toLowerCase() !== 'false';
    this.summaryEnabled =
      (this.config.get<string>('AI_SUMMARY_ENABLED') ?? 'true')
        .trim()
        .toLowerCase() !== 'false';

    this.isDevelopment =
      (this.config.get<string>('NODE_ENV') ?? 'development') === 'development';

    if (!apiKey.startsWith('AIza')) {
      this.logger.warn(
        'GEMINI_API_KEY does not look like a Google AI Studio key (expected prefix AIza). ' +
          'Create one at https://aistudio.google.com/apikey',
      );
    }
  }

  private resolveTimeoutMs(envKey: string, defaultMs: number): number {
    const raw = this.config.get<string>(envKey);
    if (raw !== undefined && raw.trim() !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return defaultMs;
  }

  async generateSuggestedTags(input: SuggestTagsInput): Promise<string[]> {
    if (!this.tagSuggestionsEnabled) {
      return [];
    }

    try {
      const prompt = buildGeminiTagPrompt(input);
      const models = buildModelsToTry(this.configuredModel);

      return await this.runWithAggregateTimeout(
        aggregateSignal =>
          this.runTagSuggestionsModelFallback(models, prompt, aggregateSignal),
        this.tagSuggestionsTotalTimeoutMs,
      );
    } catch (error) {
      if (this.isAbortError(error)) {
        this.logger.warn(
          `Gemini tag suggestions exceeded aggregate timeout (${this.tagSuggestionsTotalTimeoutMs}ms)`,
        );
        return [];
      }
      this.logger.warn('Gemini tag suggestion failed', error as Error);
      return [];
    }
  }

  private async runTagSuggestionsModelFallback(
    models: string[],
    prompt: string,
    aggregateSignal: AbortSignal,
  ): Promise<string[]> {
    for (const model of models) {
      if (aggregateSignal.aborted) {
        break;
      }

      this.logger.log(`Trying Gemini model for tag-suggestions: ${model}`);

      try {
        const tags = await this.runWithPerModelTimeout(
          signal =>
            this.tryTagSuggestionsForModel({
              model,
              prompt,
              signal,
            }),
          { parentSignal: aggregateSignal },
        );
        if (tags !== null) {
          return tags;
        }
      } catch (error) {
        if (this.isAbortError(error)) {
          if (aggregateSignal.aborted) {
            throw error;
          }
          this.logger.warn(
            `Model ${model} timed out for tag-suggestions, trying next fallback`,
          );
          continue;
        }
        throw error;
      }
    }

    return [];
  }

  async generateDocumentExtract(
    input: DocumentExtractInput,
  ): Promise<DocumentExtractOutput> {
    try {
      return await this.generateDocumentExtractWithModelFallback(input);
    } catch (error) {
      if (this.isKnownHttpError(error)) {
        throw error;
      }

      this.logger.error('Gemini document extract failed', error);
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException('AI document scan timed out');
      }
      throw new InternalServerErrorException('Unable to scan document with AI');
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

  async generateEmbedding(text: string): Promise<number[] | null> {
    const callStart = Date.now();
    try {
      const response = await this.client.models.embedContent({
        model: DEFAULT_EMBEDDING_MODEL,
        contents: text,
        config: { outputDimensionality: EMBEDDING_DIMENSIONS },
      });

      const values = response.embeddings?.[0]?.values;
      if (!values || values.length !== EMBEDDING_DIMENSIONS) {
        return null;
      }

      this.analytics.captureAiEmbedding({
        model: DEFAULT_EMBEDDING_MODEL,
        latencyMs: Date.now() - callStart,
      });
      return values;
    } catch (error) {
      this.analytics.captureAiEmbedding({
        model: DEFAULT_EMBEDDING_MODEL,
        latencyMs: Date.now() - callStart,
        error: error instanceof Error ? error.message : String(error),
      });
      this.logger.error('Failed to generate embedding', error as Error);
      return null;
    }
  }

  async generateEntitySummary(
    input: EntitySummaryContent,
  ): Promise<string | null> {
    if (!this.summaryEnabled) {
      return null;
    }

    try {
      const prompt = buildEntitySummaryPrompt(input);
      const models = buildModelsToTry(this.configuredModel);
      const totalTimeoutMs = this.summaryTimeoutMs * models.length;

      return await this.runWithAggregateTimeout(
        aggregateSignal =>
          this.runSummaryModelFallback(models, prompt, aggregateSignal),
        totalTimeoutMs,
      );
    } catch (error) {
      if (this.isAbortError(error)) {
        this.logger.warn(`Gemini entity summary exceeded aggregate timeout`);
        return null;
      }
      this.logger.warn('Gemini entity summary failed', error as Error);
      return null;
    }
  }

  private async runSummaryModelFallback(
    models: string[],
    prompt: string,
    aggregateSignal: AbortSignal,
  ): Promise<string | null> {
    for (const model of models) {
      if (aggregateSignal.aborted) {
        break;
      }

      this.logger.log(`Trying Gemini model for entity-summary: ${model}`);

      try {
        const summary = await this.runWithPerModelTimeout(
          signal => this.trySummaryForModel(model, prompt, signal),
          { parentSignal: aggregateSignal },
        );

        if (summary) {
          return summary;
        }
      } catch (error) {
        if (this.isAbortError(error)) {
          if (aggregateSignal.aborted) {
            throw error;
          }
          this.logger.warn(
            `Model ${model} timed out for entity-summary, trying next fallback`,
          );
          continue;
        }

        if (
          error instanceof Error &&
          error.message === 'QuotaExceededOrNotFound'
        ) {
          break;
        }

        throw error;
      }
    }

    return null;
  }

  private async trySummaryForModel(
    model: string,
    prompt: string,
    signal: AbortSignal,
  ): Promise<string | null> {
    const callStart = Date.now();
    const response = await generateGeminiJsonContent({
      client: this.client,
      model,
      prompt,
      jsonMode: false,
      signal,
    });

    if (!response.ok) {
      this.analytics.captureAiGeneration({
        model,
        operation: 'entity-summary',
        latencyMs: Date.now() - callStart,
        error: response.message,
        httpStatus: response.status,
      });
      this.logger.error(
        `Gemini entity-summary failed (model=${model}, status=${response.status}): ${response.message}`,
      );
      if (
        response.status === 404 ||
        isGeminiQuotaExceeded(response.status, response.message)
      ) {
        throw new Error('QuotaExceededOrNotFound');
      }
      return null;
    }

    const text = response.text.trim();
    if (!text) {
      return null;
    }

    this.analytics.captureAiGeneration({
      model,
      operation: 'entity-summary',
      latencyMs: Date.now() - callStart,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    });
    this.logSuccessfulGeneration('entity-summary', model);
    return text;
  }

  async reformulateQuery(
    message: string,
    history: { role: string; content: string }[],
  ): Promise<string | null> {
    const historyText = history
      .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const prompt = [
      'Given the conversation history below, rewrite the last user message as a short, self-contained search query.',
      'Resolve all pronouns and references. Output only the rewritten query, nothing else.',
      '',
      '== Conversation History ==',
      historyText,
      '',
      `== Last User Message ==`,
      message,
    ].join('\n');

    try {
      const models = buildModelsToTry(this.configuredModel);
      const result = await this.runWithAggregateTimeout(
        aggregateSignal =>
          this.runChatAnswerModelFallback(models, prompt, aggregateSignal),
        this.timeoutMs,
      );
      return result?.trim() || null;
    } catch {
      return null;
    }
  }

  async generateChatAnswer(prompt: string): Promise<string> {
    const models = buildModelsToTry(this.configuredModel);
    const totalTimeoutMs = this.timeoutMs * models.length;

    try {
      const answer = await this.runWithAggregateTimeout(
        aggregateSignal =>
          this.runChatAnswerModelFallback(models, prompt, aggregateSignal),
        totalTimeoutMs,
      );
      if (!answer) {
        throw new InternalServerErrorException('AI returned an empty response');
      }
      return answer;
    } catch (error) {
      if (this.isKnownHttpError(error)) {
        throw error;
      }
      if (this.isAbortError(error)) {
        throw new GatewayTimeoutException('AI chat timed out');
      }
      this.logger.error('Gemini chat answer failed', error as Error);
      throw new InternalServerErrorException('Unable to generate AI answer');
    }
  }

  async streamChatAnswer(
    prompt: string,
    onToken: (token: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    await streamGeminiContent({
      client: this.client,
      model: this.configuredModel,
      prompt,
      signal,
      onToken,
    });
  }

  private async runChatAnswerModelFallback(
    models: string[],
    prompt: string,
    aggregateSignal: AbortSignal,
  ): Promise<string | null> {
    for (const model of models) {
      if (aggregateSignal.aborted) {
        break;
      }

      this.logger.log(`Trying Gemini model for chat-answer: ${model}`);

      try {
        const answer = await this.runWithPerModelTimeout(
          signal => this.tryChatAnswerForModel(model, prompt, signal),
          { parentSignal: aggregateSignal },
        );

        if (answer) {
          return answer;
        }
      } catch (error) {
        if (this.isAbortError(error)) {
          if (aggregateSignal.aborted) {
            throw error;
          }
          this.logger.warn(
            `Model ${model} timed out for chat-answer, trying next fallback`,
          );
          continue;
        }
        throw error;
      }
    }

    return null;
  }

  private async tryChatAnswerForModel(
    model: string,
    prompt: string,
    signal: AbortSignal,
  ): Promise<string | null> {
    const callStart = Date.now();
    const response = await generateGeminiJsonContent({
      client: this.client,
      model,
      prompt,
      jsonMode: false,
      signal,
    });

    if (!response.ok) {
      this.analytics.captureAiGeneration({
        model,
        operation: 'chat-answer',
        latencyMs: Date.now() - callStart,
        error: response.message,
        httpStatus: response.status,
      });
      this.logger.error(
        `Gemini chat-answer failed (model=${model}, status=${response.status}): ${response.message}`,
      );
      return null;
    }

    const text = response.text.trim();
    if (!text) {
      return null;
    }

    this.analytics.captureAiGeneration({
      model,
      operation: 'chat-answer',
      latencyMs: Date.now() - callStart,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    });
    this.logger.log(`Gemini chat-answer succeeded (model=${model})`);
    return text;
  }

  private async generateDocumentExtractWithModelFallback(
    input: DocumentExtractInput,
  ): Promise<DocumentExtractOutput> {
    let lastProviderMessage = 'Unknown provider error';
    let lastStatus = 502;
    let lastQuotaMessage: string | undefined;
    let retryAfterSeconds: number | undefined;

    const prompt = buildDocumentExtractPrompt(
      input.documentText,
      input.entityType,
    );

    for (const model of buildModelsToTry(this.configuredModel)) {
      this.logger.log(`Trying Gemini model for document-extract: ${model}`);

      let result: Awaited<ReturnType<GeminiService['tryDocumentExtractModel']>>;
      try {
        result = await this.runWithPerModelTimeout(signal =>
          this.tryDocumentExtractModel(model, prompt, input, signal),
        );
      } catch (error) {
        if (this.isAbortError(error)) {
          this.logger.warn(
            `Model ${model} timed out for document-extract, trying next fallback`,
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

  private async tryDocumentExtractModel(
    model: string,
    prompt: string,
    input: DocumentExtractInput,
    signal: AbortSignal,
  ): Promise<
    | { kind: 'success'; data: DocumentExtractOutput }
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

    let lastProviderMessage = 'Unknown provider error';
    let lastStatus = 502;
    let lastQuotaMessage: string | undefined;
    let retryAfterSeconds: number | undefined;

    for (const attempt of attempts) {
      const callStart = Date.now();
      const response = await generateGeminiJsonContent({
        client: this.client,
        model,
        prompt,
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
        this.analytics.captureAiGeneration({
          model,
          operation: 'document-extract',
          latencyMs: Date.now() - callStart,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
        });
        this.logSuccessfulGeneration('document-extract', model, {
          jsonMode: attempt.jsonMode,
        });

        if (input.entityType === DocumentEntityType.IDEA) {
          return {
            kind: 'success',
            data: normalizeIdeaDocumentExtractResponse(parsed),
          };
        }

        return {
          kind: 'success',
          data: normalizeProblemDocumentExtractResponse(parsed),
        };
      }

      lastProviderMessage = response.message;
      lastStatus = response.status;
      this.analytics.captureAiGeneration({
        model,
        operation: 'document-extract',
        latencyMs: Date.now() - callStart,
        error: response.message,
        httpStatus: response.status,
      });
      this.logger.error(
        `Gemini request failed (model=${model}, jsonMode=${attempt.jsonMode}, status=${response.status}): ${lastProviderMessage}`,
      );

      const failure = this.resolveFailedGeminiAttempt(
        response.status,
        response.message,
        attempt.jsonMode,
      );
      if (failure === 'continue') {
        continue;
      }

      return failure;
    }

    return this.buildGeminiRetryOutcome({
      lastProviderMessage,
      lastStatus,
      lastQuotaMessage,
      retryAfterSeconds,
    });
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
    const lastQuotaMessage = state.lastQuotaMessage;
    const retryAfterSeconds = state.retryAfterSeconds;

    for (const attempt of attempts) {
      const callStart = Date.now();
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
        this.analytics.captureAiGeneration({
          model,
          operation: 'idea-prefill',
          latencyMs: Date.now() - callStart,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
        });
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
      this.analytics.captureAiGeneration({
        model,
        operation: 'idea-prefill',
        latencyMs: Date.now() - callStart,
        error: response.message,
        httpStatus: response.status,
      });
      this.logger.error(
        `Gemini request failed (model=${model}, jsonMode=${attempt.jsonMode}, status=${response.status}): ${lastProviderMessage}`,
      );

      const failure = this.resolveFailedGeminiAttempt(
        response.status,
        response.message,
        attempt.jsonMode,
      );
      if (failure === 'continue') {
        continue;
      }

      return failure;
    }

    return this.buildGeminiRetryOutcome({
      lastProviderMessage,
      lastStatus,
      lastQuotaMessage,
      retryAfterSeconds,
    });
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
      const callStart = Date.now();
      const response = await generateGeminiJsonContent({
        client: this.client,
        model,
        prompt,
        jsonMode,
        signal,
      });

      if (!response.ok) {
        this.analytics.captureAiGeneration({
          model,
          operation: 'tag-suggestions',
          latencyMs: Date.now() - callStart,
          error: response.message,
          httpStatus: response.status,
        });
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
        this.analytics.captureAiGeneration({
          model,
          operation: 'tag-suggestions',
          latencyMs: Date.now() - callStart,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
        });
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

  private async runWithAggregateTimeout<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await Promise.race([
        operation(controller.signal),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener(
            'abort',
            () => {
              reject(
                Object.assign(new Error('Operation timed out'), {
                  name: 'AbortError',
                }),
              );
            },
            { once: true },
          );
        }),
      ]);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async runWithPerModelTimeout<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    options?: { parentSignal?: AbortSignal },
  ): Promise<T> {
    const controller = new AbortController();
    const onParentAbort = () => controller.abort();
    options?.parentSignal?.addEventListener('abort', onParentAbort, {
      once: true,
    });

    // Explicitly use this.summaryTimeoutMs or this.timeoutMs based on context,
    // but here we are hardcoding the general timeoutMs since it's the default
    // for generic model calls. In a refactor, pass the specific timeout down.
    const timeoutToUse = this.timeoutMs;

    const timeoutId = setTimeout(() => controller.abort(), timeoutToUse);
    try {
      return await operation(controller.signal);
    } finally {
      clearTimeout(timeoutId);
      options?.parentSignal?.removeEventListener('abort', onParentAbort);
    }
  }

  private logSuccessfulGeneration(
    operation:
      | 'idea-prefill'
      | 'tag-suggestions'
      | 'entity-summary'
      | 'document-extract'
      | 'chat-answer',
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

  private resolveFailedGeminiAttempt(
    status: number,
    message: string,
    jsonMode: boolean,
  ): 'continue' | GeminiModelFailureOutcome {
    if (isGeminiQuotaExceeded(status, message)) {
      return this.buildGeminiRetryOutcome({
        lastProviderMessage: message,
        lastStatus: status,
        lastQuotaMessage: message,
        retryAfterSeconds: parseGeminiRetryAfterSeconds(message),
      });
    }

    if (status === 400 && jsonMode) {
      return 'continue';
    }

    return this.buildGeminiModelFailureOutcome(
      status === 404 ? 'retry' : 'fatal',
      {
        lastProviderMessage: message,
        lastStatus: status,
      },
    );
  }

  private buildGeminiRetryOutcome(
    state: Omit<GeminiModelFailureOutcome, 'kind'>,
  ): GeminiModelFailureOutcome {
    return this.buildGeminiModelFailureOutcome('retry', state);
  }

  private buildGeminiModelFailureOutcome(
    kind: GeminiModelFailureOutcome['kind'],
    state: Omit<GeminiModelFailureOutcome, 'kind'>,
  ): GeminiModelFailureOutcome {
    return {
      kind,
      lastProviderMessage: state.lastProviderMessage,
      lastStatus: state.lastStatus,
      lastQuotaMessage: state.lastQuotaMessage,
      retryAfterSeconds: state.retryAfterSeconds,
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
