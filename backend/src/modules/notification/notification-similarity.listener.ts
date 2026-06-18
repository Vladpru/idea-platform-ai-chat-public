import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { IdeaStatus, ProblemStatus } from '../../../generated/prisma/client';
import {
  EMBEDDING_EVENTS,
  type EmbeddingSyncedEvent,
} from '../embedding/embedding.events';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildSearchText } from '../../shared/utils/fts.util';
import { SimilarityRepository } from '../similarity/similarity.repository';
import { NOTIFICATION_EVENTS } from './events/notification-event-names';
import type { SimilarFoundNotificationEvent } from './events/notification.events';

type PublishedSource = {
  id: string;
  title: string | null;
  description: string | null;
  authorId: string;
};

@Injectable()
export class NotificationSimilarityListener {
  private readonly logger = new Logger(NotificationSimilarityListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly similarityRepository: SimilarityRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(EMBEDDING_EVENTS.SYNCED, { async: true })
  async handleEmbeddingSynced(event: EmbeddingSyncedEvent): Promise<void> {
    try {
      const source = await this.loadPublishedSource(
        event.entityType,
        event.entityId,
      );

      if (!source) {
        return;
      }

      const ftsText = buildSearchText(source.title, source.description);
      const similarIds = await this.similarityRepository.findSimilarIds({
        entityType: event.entityType,
        vectorLiteral: event.vectorLiteral,
        vectorAvailable: true,
        ftsText,
        excludeId: event.entityId,
        limit: 3,
      });

      if (similarIds.length === 0) {
        return;
      }

      const matches = await this.buildMatches(
        event.entityType,
        similarIds,
        source.authorId,
      );

      if (matches.length === 0) {
        return;
      }

      const payload: SimilarFoundNotificationEvent = {
        entityType: event.entityType,
        sourceEntityId: event.entityId,
        sourceEntityTitle: source.title ?? 'Untitled',
        matches,
      };

      this.eventEmitter.emit(NOTIFICATION_EVENTS.SIMILAR_FOUND, payload);
    } catch (error) {
      this.logger.error(
        `Similarity notification failed for ${event.entityType} ${event.entityId}`,
        error,
      );
    }
  }

  private async loadPublishedSource(
    entityType: EmbeddingSyncedEvent['entityType'],
    entityId: string,
  ): Promise<PublishedSource | null> {
    if (entityType === 'idea') {
      return this.prisma.idea.findFirst({
        where: { id: entityId, status: IdeaStatus.PUBLISHED },
        select: {
          id: true,
          title: true,
          description: true,
          authorId: true,
        },
      });
    }

    return this.prisma.problem.findFirst({
      where: { id: entityId, status: ProblemStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        description: true,
        authorId: true,
      },
    });
  }

  private async buildMatches(
    entityType: EmbeddingSyncedEvent['entityType'],
    similarIds: string[],
    sourceAuthorId: string,
  ): Promise<SimilarFoundNotificationEvent['matches']> {
    if (entityType === 'idea') {
      const ideas = await this.prisma.idea.findMany({
        where: { id: { in: similarIds } },
        select: { id: true, title: true, authorId: true },
      });
      const ideasById = new Map(ideas.map(idea => [idea.id, idea]));

      return similarIds
        .map(id => ideasById.get(id))
        .filter((idea): idea is NonNullable<typeof idea> => idea !== undefined)
        .filter(idea => idea.authorId !== sourceAuthorId)
        .map(idea => ({
          matchedEntityId: idea.id,
          matchedEntityTitle: idea.title ?? 'Untitled',
          recipientUserId: idea.authorId,
        }));
    }

    const problems = await this.prisma.problem.findMany({
      where: { id: { in: similarIds } },
      select: { id: true, title: true, authorId: true },
    });
    const problemsById = new Map(
      problems.map(problem => [problem.id, problem]),
    );

    return similarIds
      .map(id => problemsById.get(id))
      .filter(
        (problem): problem is NonNullable<typeof problem> =>
          problem !== undefined,
      )
      .filter(problem => problem.authorId !== sourceAuthorId)
      .map(problem => ({
        matchedEntityId: problem.id,
        matchedEntityTitle: problem.title ?? 'Untitled',
        recipientUserId: problem.authorId,
      }));
  }
}
