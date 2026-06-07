import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AiSummaryService } from './ai-summary.service';
import type { SummaryRequestedEvent } from './summary.types';

@Injectable()
export class AiSummaryListener {
  private readonly logger = new Logger(AiSummaryListener.name);

  constructor(private readonly aiSummaryService: AiSummaryService) {}

  @OnEvent('summary.requested', { async: true })
  async handleSummaryRequested(payload: SummaryRequestedEvent): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    let delayMs = 2000;

    while (attempt < maxRetries) {
      try {
        await this.aiSummaryService.processSummaryRequest(payload);
        return;
      } catch (error: unknown) {
        attempt++;
        const isTransient = this.isTransientError(error);

        this.logger.error(
          `[ReqID: ${payload.entityType}-${payload.id}] AI summary job failed (Attempt ${attempt}/${maxRetries})`,
          error instanceof Error ? error.stack : String(error),
        );

        if (!isTransient || attempt >= maxRetries) {
          try {
            await this.aiSummaryService.markFailed(payload);
          } catch (markError) {
            this.logger.error(
              `[ReqID: ${payload.entityType}-${payload.id}] Failed to mark summary as FAILED`,
              markError instanceof Error ? markError.stack : String(markError),
            );
          }
          return;
        }

        await this.sleep(delayMs);
        delayMs *= 2;
      }
    }
  }

  private isTransientError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    let status: number | undefined;

    if ('status' in error && typeof error.status === 'number') {
      status = error.status;
    } else if (
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'status' in error.response &&
      typeof (error.response as Record<string, unknown>).status === 'number'
    ) {
      status = (error.response as Record<string, unknown>).status as number;
    }

    if (status === 429 || status === 503 || status === 504) {
      return true;
    }

    const name =
      'name' in error && typeof error.name === 'string' ? error.name : '';
    const message =
      'message' in error && typeof error.message === 'string'
        ? error.message
        : '';

    return name === 'TimeoutError' || message.includes('Timeout');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
