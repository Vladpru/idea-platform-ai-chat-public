import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../../core/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import {
  buildIdeaEmbeddingContent,
  buildProblemEmbeddingContent,
  hashEmbeddingContent,
} from './embedding-content.util';
import { EMBEDDING_EVENTS } from './embedding.events';

@Injectable()
export class EntityEmbeddingSyncService {
  private readonly logger = new Logger(EntityEmbeddingSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async processPendingBatch(limit: number): Promise<void> {
    await this.processIdeas(limit);
    await this.processProblems(limit);
  }

  private async processIdeas(limit: number): Promise<void> {
    const lockedRows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "idea"
      WHERE "embedding_hash" IS NULL
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    if (!lockedRows || lockedRows.length === 0) return;

    const ids = lockedRows.map(row => row.id);

    const pending = await this.prisma.idea.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        description: true,
        tags: { include: { tag: true } },
      },
    });

    for (const idea of pending) {
      try {
        const tagNames = idea.tags.map(t => t.tag.name);
        const content = buildIdeaEmbeddingContent({
          title: idea.title,
          description: idea.description,
          tagNames,
        });

        const hash = hashEmbeddingContent(content);
        const vector = await this.geminiService.generateEmbedding(content);

        if (!vector) continue;

        const vectorLiteral = `[${vector.join(',')}]`;

        await this.prisma.$executeRaw`
          UPDATE "idea" 
          SET "ai_embedding" = ${vectorLiteral}::vector, "embedding_hash" = ${hash} 
          WHERE id = ${idea.id}
        `;

        this.eventEmitter.emit(EMBEDDING_EVENTS.SYNCED, {
          entityType: 'idea',
          entityId: idea.id,
          vectorLiteral,
        });
      } catch (error) {
        this.logger.error(`Failed to sync idea ${idea.id}`, error);
        await this.prisma.$executeRaw`
          UPDATE "idea" 
          SET "embedding_hash" = 'ERROR' 
          WHERE id = ${idea.id}
        `;
      }
    }
  }

  private async processProblems(limit: number): Promise<void> {
    const lockedRows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "problem"
      WHERE "embedding_hash" IS NULL
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    if (!lockedRows || lockedRows.length === 0) return;

    const ids = lockedRows.map(row => row.id);

    const pending = await this.prisma.problem.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        description: true,
        valueProposition: true,
        category: true,
        impact: true,
        tags: { include: { tag: true } },
      },
    });

    for (const problem of pending) {
      try {
        const tagNames = problem.tags.map(t => t.tag.name);
        const content = buildProblemEmbeddingContent({
          title: problem.title,
          description: problem.description,
          valueProposition: problem.valueProposition,
          category: problem.category,
          impact: problem.impact,
          tagNames,
        });

        const hash = hashEmbeddingContent(content);
        const vector = await this.geminiService.generateEmbedding(content);

        if (!vector) continue;

        const vectorLiteral = `[${vector.join(',')}]`;

        await this.prisma.$executeRaw`
          UPDATE "problem" 
          SET "ai_embedding" = ${vectorLiteral}::vector, "embedding_hash" = ${hash} 
          WHERE id = ${problem.id}
        `;

        this.eventEmitter.emit(EMBEDDING_EVENTS.SYNCED, {
          entityType: 'problem',
          entityId: problem.id,
          vectorLiteral,
        });
      } catch (error) {
        this.logger.error(`Failed to sync problem ${problem.id}`, error);
        await this.prisma.$executeRaw`
          UPDATE "problem" 
          SET "embedding_hash" = 'ERROR' 
          WHERE id = ${problem.id}
        `;
      }
    }
  }
}
