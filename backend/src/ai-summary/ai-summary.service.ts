import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { SummaryStatus } from '../../generated/prisma/client';
import { GeminiService } from '../ai/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { hasSummarizableContent } from './summary-content.util';
import type {
  EntitySummaryContent,
  SummaryRequestedEvent,
} from './summary.types';

type UpdateData = {
  aiSummary?: string | null;
  summaryStatus: SummaryStatus;
};

interface EntityStrategy {
  load(id: string): Promise<EntitySummaryContent | null>;
  update(id: string, data: UpdateData): Promise<void>;
  getStatus(id: string): Promise<SummaryStatus | null>;
}

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  private readonly strategies: Record<string, EntityStrategy>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.strategies = {
      idea: {
        load: async id => {
          const data = await this.prisma.idea.findUnique({
            where: { id },
            select: { title: true, description: true },
          });
          return data ? { entityType: 'idea', ...data } : null;
        },
        update: async (id, data) => {
          await this.prisma.idea
            .update({ where: { id }, data })
            .catch(this.handlePrismaNotFound);
        },
        getStatus: async id => {
          const data = await this.prisma.idea.findUnique({
            where: { id },
            select: { summaryStatus: true },
          });
          return data?.summaryStatus ?? null;
        },
      },
      problem: {
        load: async id => {
          const data = await this.prisma.problem.findUnique({
            where: { id },
            select: {
              title: true,
              description: true,
              valueProposition: true,
              category: true,
              impact: true,
            },
          });
          return data ? { entityType: 'problem', ...data } : null;
        },
        update: async (id, data) => {
          await this.prisma.problem
            .update({ where: { id }, data })
            .catch(this.handlePrismaNotFound);
        },
        getStatus: async id => {
          const data = await this.prisma.problem.findUnique({
            where: { id },
            select: { summaryStatus: true },
          });
          return data?.summaryStatus ?? null;
        },
      },
    };
  }

  private handlePrismaNotFound = (error: unknown): void => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as Record<string, unknown>).code === 'P2025'
    ) {
      return;
    }
    throw error;
  };

  async requestGeneration(payload: SummaryRequestedEvent): Promise<boolean> {
    try {
      await this.eventEmitter.emitAsync('summary.requested', payload);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to emit summary.requested for ${payload.entityType} ${payload.id}`,
        error,
      );
      return false;
    }
  }

  async processSummaryRequest(payload: SummaryRequestedEvent): Promise<void> {
    const strategy = this.strategies[payload.entityType];

    if (!strategy) {
      throw new Error(`Unsupported entity type: ${payload.entityType}`);
    }

    const currentStatus = await strategy.getStatus(payload.id);

    if (currentStatus !== SummaryStatus.PENDING) {
      this.logger.warn(
        `Skipping ${payload.entityType} ${payload.id}: status is ${currentStatus}`,
      );
      return;
    }

    const content = await strategy.load(payload.id);

    if (!content || !hasSummarizableContent(content)) {
      this.logger.warn(
        `Skipping AI summary for ${payload.entityType} ${payload.id}: insufficient content`,
      );
      return;
    }

    const summary = await this.geminiService.generateEntitySummary(content);

    if (!summary) {
      await this.markFailed(payload);
      return;
    }

    await this.markCompleted(payload, summary);
  }

  async resetForRegeneration(payload: SummaryRequestedEvent): Promise<void> {
    const strategy = this.strategies[payload.entityType];
    if (!strategy) {
      return;
    }

    await strategy.update(payload.id, {
      aiSummary: null,
      summaryStatus: SummaryStatus.PENDING,
    });
  }

  public async markFailed(payload: SummaryRequestedEvent): Promise<void> {
    const strategy = this.strategies[payload.entityType];
    if (!strategy) {
      return;
    }

    await strategy.update(payload.id, {
      summaryStatus: SummaryStatus.FAILED,
    });
  }

  private async markCompleted(
    payload: SummaryRequestedEvent,
    summary: string,
  ): Promise<void> {
    const strategy = this.strategies[payload.entityType];
    if (!strategy) {
      return;
    }

    await strategy.update(payload.id, {
      aiSummary: summary,
      summaryStatus: SummaryStatus.COMPLETED,
    });
  }
}
