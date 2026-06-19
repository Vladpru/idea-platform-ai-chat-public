import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

const BACKEND_DISTINCT_ID = 'backend-system';

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private readonly client: PostHog | null = null;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('POSTHOG_API_KEY');
    if (!apiKey) {
      this.logger.warn('POSTHOG_API_KEY not set — AI observability disabled');
      return;
    }
    const host =
      this.config.get<string>('POSTHOG_HOST') || 'https://eu.i.posthog.com';
    this.client = new PostHog(apiKey, {
      host,
      flushAt: 20,
      flushInterval: 10_000,
    });
  }

  captureAiGeneration(params: {
    model: string;
    operation: string;
    latencyMs: number;
    inputTokens?: number;
    outputTokens?: number;
    error?: string;
    httpStatus?: number;
  }): void {
    if (!this.client) return;
    const traceId = randomUUID();
    this.client.capture({
      distinctId: BACKEND_DISTINCT_ID,
      event: '$ai_generation',
      properties: {
        $ai_provider: 'google',
        $ai_model: params.model,
        $ai_latency: params.latencyMs / 1000,
        $ai_trace_id: traceId,
        $ai_span_id: traceId,
        $ai_span_name: params.operation,
        ...(params.inputTokens !== undefined && {
          $ai_input_tokens: params.inputTokens,
        }),
        ...(params.outputTokens !== undefined && {
          $ai_output_tokens: params.outputTokens,
        }),
        ...(params.error && { $ai_error: params.error, $ai_is_error: true }),
        ...(params.httpStatus !== undefined && {
          $ai_http_status: params.httpStatus,
        }),
      },
    });
  }

  captureAiEmbedding(params: {
    model: string;
    latencyMs: number;
    error?: string;
  }): void {
    if (!this.client) return;
    const traceId = randomUUID();
    this.client.capture({
      distinctId: BACKEND_DISTINCT_ID,
      event: '$ai_embedding',
      properties: {
        $ai_provider: 'google',
        $ai_model: params.model,
        $ai_latency: params.latencyMs / 1000,
        $ai_trace_id: traceId,
        $ai_span_id: traceId,
        $ai_span_name: 'embedding',
        ...(params.error && { $ai_error: params.error, $ai_is_error: true }),
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.shutdown();
  }
}
