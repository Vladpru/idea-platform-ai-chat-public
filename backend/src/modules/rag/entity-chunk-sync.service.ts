import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PrismaService } from '../../core/prisma/prisma.service';
import {
  EMBEDDING_EVENTS,
  type EmbeddingSyncedEvent,
} from '../embedding/embedding.events';
import { EmbeddingService } from '../embedding/embedding.service';
import { toPgVectorLiteral } from '../embedding/vector.util';

@Injectable()
export class EntityChunkSyncService {
  private readonly logger = new Logger(EntityChunkSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @OnEvent(EMBEDDING_EVENTS.SYNCED)
  async handleEmbeddingSynced(event: EmbeddingSyncedEvent): Promise<void> {
    try {
      await this.syncEntity(event.entityType, event.entityId);
    } catch (error) {
      this.logger.error(
        `Failed to sync chunk for ${event.entityType} ${event.entityId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async syncEntity(
    entityType: 'idea' | 'problem',
    entityId: string,
  ): Promise<void> {
    if (entityType === 'idea') {
      await this.syncIdea(entityId);
    } else {
      await this.syncProblem(entityId);
    }
  }

  private async deleteChunk(source: string): Promise<void> {
    await this.prisma
      .$executeRaw`DELETE FROM knowledge_chunk WHERE source = ${source}`;
  }

  private async insertChunk(
    source: string,
    content: string,
    metadata: string,
    vectorLiteral: string,
  ): Promise<void> {
    await this.prisma
      .$executeRaw`INSERT INTO knowledge_chunk (id, source, content, embedding, metadata, file_hash, created_at) VALUES (gen_random_uuid(), ${source}, ${content}, ${vectorLiteral}::vector, ${metadata}::jsonb, NULL, NOW())`;
  }

  private async embedAndSync(
    source: string,
    content: string,
    metadata: string,
    entityLabel: string,
  ): Promise<void> {
    let vectorLiteral: string | null = null;
    try {
      const vector = await this.embeddingService.embedText(content);
      vectorLiteral = toPgVectorLiteral(vector);
    } catch (error) {
      this.logger.error(
        `Failed to embed ${entityLabel}, chunk removed`,
        error instanceof Error ? error.message : String(error),
      );
    }
    await this.deleteChunk(source);
    if (!vectorLiteral) return;
    await this.insertChunk(source, content, metadata, vectorLiteral);
  }

  async reconcileAll(): Promise<{ synced: number; removed: number }> {
    const [ideas, problems] = await Promise.all([
      this.prisma.idea.findMany({
        where: { status: { in: ['PUBLISHED', 'DRAFT'] } },
        select: { id: true },
      }),
      this.prisma.problem.findMany({
        where: { status: { in: ['PUBLISHED', 'DRAFT'] } },
        select: { id: true },
      }),
    ]);

    const activeSourceSet = new Set<string>([
      ...ideas.map(i => `idea:${i.id}`),
      ...problems.map(p => `problem:${p.id}`),
    ]);

    const existingRows = await this.prisma.$queryRaw<Array<{ source: string }>>`
      SELECT DISTINCT source FROM knowledge_chunk
      WHERE source LIKE 'idea:%' OR source LIKE 'problem:%'
    `;

    let removed = 0;
    for (const { source } of existingRows) {
      if (!activeSourceSet.has(source)) {
        await this.deleteChunk(source);
        removed++;
      }
    }

    let synced = 0;
    for (const idea of ideas) {
      try {
        await this.syncIdea(idea.id);
        synced++;
      } catch (error) {
        this.logger.error(
          `Reconcile failed for idea ${idea.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
    for (const problem of problems) {
      try {
        await this.syncProblem(problem.id);
        synced++;
      } catch (error) {
        this.logger.error(
          `Reconcile failed for problem ${problem.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return { synced, removed };
  }

  private async syncIdea(ideaId: string): Promise<void> {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      select: {
        id: true,
        title: true,
        description: true,
        stage: true,
        status: true,
        authorId: true,
        author: { select: { firstName: true, lastName: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    });

    const source = `idea:${ideaId}`;

    if (!idea) {
      await this.deleteChunk(source);
      return;
    }

    if (idea.status !== 'PUBLISHED' && idea.status !== 'DRAFT') {
      await this.deleteChunk(source);
      return;
    }

    const tagNames = idea.tags.map(t => t.tag.name);
    const authorName = idea.author
      ? [idea.author.firstName, idea.author.lastName].filter(Boolean).join(' ')
      : '';
    const content = [
      `Type: Idea`,
      `Title: ${idea.title ?? ''}`,
      `Description: ${idea.description ?? ''}`,
      `Tags: ${tagNames.join(', ')}`,
      `Stage: ${idea.stage ?? ''}`,
      `Status: ${idea.status}`,
      `Author: ${authorName}`,
    ].join('\n');

    const metadata = JSON.stringify({
      type: 'idea',
      id: idea.id,
      title: idea.title ?? '',
      tags: tagNames,
      stage: idea.stage,
      status: idea.status,
      authorId: idea.authorId,
      authorName: authorName || null,
    });

    await this.embedAndSync(source, content, metadata, `idea ${ideaId}`);
  }

  private async syncProblem(problemId: string): Promise<void> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        title: true,
        description: true,
        valueProposition: true,
        category: true,
        impact: true,
        stage: true,
        status: true,
        authorId: true,
        author: { select: { firstName: true, lastName: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    });

    const source = `problem:${problemId}`;

    if (!problem) {
      await this.deleteChunk(source);
      return;
    }

    if (problem.status !== 'PUBLISHED' && problem.status !== 'DRAFT') {
      await this.deleteChunk(source);
      return;
    }

    const tagNames = problem.tags.map(t => t.tag.name);
    const authorName = problem.author
      ? [problem.author.firstName, problem.author.lastName]
          .filter(Boolean)
          .join(' ')
      : '';
    const content = [
      `Type: Problem`,
      `Title: ${problem.title ?? ''}`,
      `Description: ${problem.description ?? ''}`,
      `Value Proposition: ${problem.valueProposition ?? ''}`,
      `Category: ${problem.category ?? ''}`,
      `Impact: ${problem.impact ?? ''}`,
      `Tags: ${tagNames.join(', ')}`,
      `Stage: ${problem.stage ?? ''}`,
      `Status: ${problem.status}`,
      `Author: ${authorName}`,
    ].join('\n');

    const metadata = JSON.stringify({
      type: 'problem',
      id: problem.id,
      title: problem.title,
      tags: tagNames,
      stage: problem.stage,
      status: problem.status,
      authorId: problem.authorId,
      authorName: authorName || null,
    });

    await this.embedAndSync(source, content, metadata, `problem ${problemId}`);
  }
}
