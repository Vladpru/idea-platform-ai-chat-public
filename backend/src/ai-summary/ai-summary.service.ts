import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { SummaryStatus } from '../../generated/prisma/client';
import { GeminiService } from '../ai/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { hasSummarizableContent } from './summary-content.util';
import type {
  EntitySummaryContent,
  ProblemSubstantialExisting,
  SummaryRequestedEvent,
} from './summary.types';

type UpdateData = {
  aiSummary?: string | null;
  summaryStatus: SummaryStatus;
};

const SKIPPED_SUMMARY_STATUS: SummaryStatus = 'SKIPPED';

export type PublishedProblemSummaryInput = ProblemSubstantialExisting & {
  id: string;
};

interface EntityStrategy {
  load(id: string): Promise<EntitySummaryContent | null>;
  update(id: string, data: UpdateData): Promise<void>;
  getStatus(id: string): Promise<SummaryStatus | null>;
  getUpdatedAt(id: string): Promise<Date | null>;
  completeIfPending(id: string, anchor: Date, summary: string): Promise<number>;
  failIfPending(id: string, anchor: Date): Promise<number>;
  skipIfPending(id: string, anchor: Date): Promise<number>;
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
      idea: this.buildIdeaStrategy(),
      problem: this.buildProblemStrategy(),
    };
  }

  private buildIdeaStrategy(): EntityStrategy {
    return {
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
      getUpdatedAt: async id => {
        const data = await this.prisma.idea.findUnique({
          where: { id },
          select: { updatedAt: true },
        });
        return data?.updatedAt ?? null;
      },
      completeIfPending: async (id, anchor, summary) => {
        const result = await this.prisma.idea.updateMany({
          where: {
            id,
            summaryStatus: SummaryStatus.PENDING,
            updatedAt: anchor,
          },
          data: {
            aiSummary: summary,
            summaryStatus: SummaryStatus.COMPLETED,
          },
        });
        return result.count;
      },
      failIfPending: async (id, anchor) => {
        const result = await this.prisma.idea.updateMany({
          where: {
            id,
            summaryStatus: SummaryStatus.PENDING,
            updatedAt: anchor,
          },
          data: { summaryStatus: SummaryStatus.FAILED },
        });
        return result.count;
      },
      skipIfPending: async (id, anchor) => {
        const result = await this.prisma.idea.updateMany({
          where: {
            id,
            summaryStatus: SummaryStatus.PENDING,
            updatedAt: anchor,
          },
          data: {
            aiSummary: null,
            summaryStatus: SKIPPED_SUMMARY_STATUS,
          },
        });
        return result.count;
      },
    };
  }

  private buildProblemStrategy(): EntityStrategy {
    return {
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
      getUpdatedAt: async id => {
        const data = await this.prisma.problem.findUnique({
          where: { id },
          select: { updatedAt: true },
        });
        return data?.updatedAt ?? null;
      },
      completeIfPending: async (id, anchor, summary) => {
        const result = await this.prisma.problem.updateMany({
          where: {
            id,
            summaryStatus: SummaryStatus.PENDING,
            updatedAt: anchor,
          },
          data: {
            aiSummary: summary,
            summaryStatus: SummaryStatus.COMPLETED,
          },
        });
        return result.count;
      },
      failIfPending: async (id, anchor) => {
        const result = await this.prisma.problem.updateMany({
          where: {
            id,
            summaryStatus: SummaryStatus.PENDING,
            updatedAt: anchor,
          },
          data: { summaryStatus: SummaryStatus.FAILED },
        });
        return result.count;
      },
      skipIfPending: async (id, anchor) => {
        const result = await this.prisma.problem.updateMany({
          where: {
            id,
            summaryStatus: SummaryStatus.PENDING,
            updatedAt: anchor,
          },
          data: {
            aiSummary: null,
            summaryStatus: SKIPPED_SUMMARY_STATUS,
          },
        });
        return result.count;
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

  /** Fire-and-forget: dispatches background summary generation without blocking callers. */
  enqueueIdeaSummary(id: string): void {
    this.enqueueGeneration({ entityType: 'idea', id });
  }

  /** Fire-and-forget: dispatches background summary generation without blocking callers. */
  enqueueProblemSummary(id: string): void {
    this.enqueueGeneration({ entityType: 'problem', id });
  }

  enqueueSummariesForPublishedProblems(
    problems: PublishedProblemSummaryInput[],
  ): void {
    for (const problem of problems) {
      if (
        hasSummarizableContent({
          entityType: 'problem',
          title: problem.title,
          description: problem.description,
          valueProposition: problem.valueProposition,
          category: problem.category,
          impact: problem.impact,
        })
      ) {
        this.enqueueProblemSummary(problem.id);
      }
    }
  }

  private enqueueGeneration(payload: SummaryRequestedEvent): void {
    try {
      this.eventEmitter.emit('summary.requested', payload);
    } catch (error) {
      this.logger.error(
        `Failed to emit summary.requested for ${payload.entityType} ${payload.id}`,
        error,
      );
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

    const anchor = await strategy.getUpdatedAt(payload.id);

    if (!anchor) {
      this.logger.warn(
        `Skipping ${payload.entityType} ${payload.id}: entity not found`,
      );
      return;
    }

    const content = await strategy.load(payload.id);

    if (!content || !hasSummarizableContent(content)) {
      this.logger.warn(
        `Skipping AI summary for ${payload.entityType} ${payload.id}: insufficient content`,
      );
      await this.markSkipped(payload, anchor);
      return;
    }

    const summary = await this.geminiService.generateEntitySummary(content);

    if (!summary) {
      await this.markFailed(payload, anchor);
      return;
    }

    await this.markCompleted(payload, anchor, summary);
  }

  public async markFailed(
    payload: SummaryRequestedEvent,
    anchor?: Date,
  ): Promise<void> {
    const strategy = this.strategies[payload.entityType];
    if (!strategy) {
      return;
    }

    if (anchor) {
      const count = await strategy.failIfPending(payload.id, anchor);
      if (count === 0) {
        this.logger.warn(
          `Stale fail write for ${payload.entityType} ${payload.id}`,
        );
      }
      return;
    }

    await strategy.update(payload.id, {
      summaryStatus: SummaryStatus.FAILED,
    });
  }

  public async markSkipped(
    payload: SummaryRequestedEvent,
    anchor?: Date,
  ): Promise<void> {
    const strategy = this.strategies[payload.entityType];
    if (!strategy) {
      return;
    }

    if (anchor) {
      const count = await strategy.skipIfPending(payload.id, anchor);
      if (count === 0) {
        this.logger.warn(
          `Stale skip write for ${payload.entityType} ${payload.id}`,
        );
      }
      return;
    }

    await strategy.update(payload.id, {
      aiSummary: null,
      summaryStatus: SKIPPED_SUMMARY_STATUS,
    });
  }

  private async markCompleted(
    payload: SummaryRequestedEvent,
    anchor: Date,
    summary: string,
  ): Promise<void> {
    const strategy = this.strategies[payload.entityType];
    if (!strategy) {
      return;
    }

    const count = await strategy.completeIfPending(payload.id, anchor, summary);

    if (count === 0) {
      this.logger.warn(
        `Stale complete write for ${payload.entityType} ${payload.id}`,
      );
    }
  }
}
