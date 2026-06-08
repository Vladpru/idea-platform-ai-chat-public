import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

import { IdeaStatus, ProblemStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATION_EVENTS } from './events/notification-event-names';
import type { FollowUpRequiredNotificationEvent } from './events/notification.events';

type StaleDraftRecord = {
  id: string;
  title: string | null;
  authorId: string;
  updatedAt: Date;
};

const STALE_DRAFT_SELECT = {
  id: true,
  title: true,
  authorId: true,
  updatedAt: true,
} as const;

@Injectable()
export class FollowUpCronService {
  private readonly logger = new Logger(FollowUpCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleStaleDraftFollowUps(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    await this.processStaleIdeas(cutoff);
    await this.processStaleProblems(cutoff);
  }

  private async fetchStaleIdeas(
    cutoff: Date,
    lastId?: string,
  ): Promise<StaleDraftRecord[]> {
    return this.prisma.idea.findMany({
      where: {
        status: IdeaStatus.DRAFT,
        updatedAt: { lt: cutoff },
      },
      take: 100,
      ...(lastId ? { skip: 1, cursor: { id: lastId } } : {}),
      select: STALE_DRAFT_SELECT,
      orderBy: { id: 'asc' },
    });
  }

  private async fetchStaleProblems(
    cutoff: Date,
    lastId?: string,
  ): Promise<StaleDraftRecord[]> {
    return this.prisma.problem.findMany({
      where: {
        status: ProblemStatus.DRAFT,
        updatedAt: { lt: cutoff },
      },
      take: 100,
      ...(lastId ? { skip: 1, cursor: { id: lastId } } : {}),
      select: STALE_DRAFT_SELECT,
      orderBy: { id: 'asc' },
    });
  }

  private async processStaleIdeas(cutoff: Date): Promise<void> {
    let hasMore = true;
    let lastId: string | undefined;

    while (hasMore) {
      const ideas = await this.fetchStaleIdeas(cutoff, lastId);

      if (ideas.length === 0) {
        hasMore = false;
        break;
      }

      lastId = ideas[ideas.length - 1].id;

      for (const idea of ideas) {
        try {
          const alreadyNotified = await this.hasRecentFollowUpNotification(
            idea.authorId,
            'idea',
            idea.id,
            cutoff,
          );

          if (alreadyNotified) {
            continue;
          }

          const event: FollowUpRequiredNotificationEvent = {
            recipientUserId: idea.authorId,
            entityType: 'idea',
            entityId: idea.id,
            entityTitle: idea.title ?? 'Untitled',
            draftUpdatedAt: idea.updatedAt.toISOString(),
          };
          this.eventEmitter.emit(NOTIFICATION_EVENTS.FOLLOWUP_REQUIRED, event);
        } catch (error) {
          this.logger.error(`Failed to process stale idea ${idea.id}`, error);
        }
      }
    }
  }

  private async processStaleProblems(cutoff: Date): Promise<void> {
    let hasMore = true;
    let lastId: string | undefined;

    while (hasMore) {
      const problems = await this.fetchStaleProblems(cutoff, lastId);

      if (problems.length === 0) {
        hasMore = false;
        break;
      }

      lastId = problems[problems.length - 1].id;

      for (const problem of problems) {
        try {
          const alreadyNotified = await this.hasRecentFollowUpNotification(
            problem.authorId,
            'problem',
            problem.id,
            cutoff,
          );

          if (alreadyNotified) {
            continue;
          }

          const event: FollowUpRequiredNotificationEvent = {
            recipientUserId: problem.authorId,
            entityType: 'problem',
            entityId: problem.id,
            entityTitle: problem.title ?? 'Untitled',
            draftUpdatedAt: problem.updatedAt.toISOString(),
          };
          this.eventEmitter.emit(NOTIFICATION_EVENTS.FOLLOWUP_REQUIRED, event);
        } catch (error) {
          this.logger.error(
            `Failed to process stale problem ${problem.id}`,
            error,
          );
        }
      }
    }
  }

  private async hasRecentFollowUpNotification(
    userId: string,
    entityType: 'idea' | 'problem',
    entityId: string,
    since: Date,
  ): Promise<boolean> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: NOTIFICATION_EVENTS.FOLLOWUP_REQUIRED,
        createdAt: { gte: since },
        AND: [
          {
            payload: {
              path: ['entityId'],
              equals: entityId,
            },
          },
          {
            payload: {
              path: ['entityType'],
              equals: entityType,
            },
          },
        ],
      },
      select: { id: true },
    });

    return existing !== null;
  }
}
