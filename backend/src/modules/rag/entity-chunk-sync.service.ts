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

  private async syncIdea(ideaId: string): Promise<void> {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      select: {
        id: true,
        title: true,
        description: true,
        stage: true,
        status: true,
        author: { select: { firstName: true, lastName: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    });

    const source = `idea:${ideaId}`;

    if (!idea) {
      await this.deleteChunk(source);
      return;
    }

    if (idea.status !== 'PUBLISHED') {
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
      tags: tagNames,
      stage: idea.stage,
      status: idea.status,
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
        author: { select: { firstName: true, lastName: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    });

    const source = `problem:${problemId}`;

    if (!problem) {
      await this.deleteChunk(source);
      return;
    }

    if (problem.status !== 'PUBLISHED') {
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
      tags: tagNames,
      stage: problem.stage,
      status: problem.status,
      authorName: authorName || null,
    });

    await this.embedAndSync(source, content, metadata, `problem ${problemId}`);
  }
}
