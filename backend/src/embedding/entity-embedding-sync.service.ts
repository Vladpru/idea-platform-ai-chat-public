import { Injectable, Logger } from '@nestjs/common';

import { GeminiService } from '../ai/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildIdeaEmbeddingContent,
  buildProblemEmbeddingContent,
  hashEmbeddingContent,
} from './embedding-content.util';

@Injectable()
export class EntityEmbeddingSyncService {
  private readonly logger = new Logger(EntityEmbeddingSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  async processPendingBatch(limit: number): Promise<void> {
    await this.processIdeas(limit);
    await this.processProblems(limit);
  }

  private async processIdeas(limit: number): Promise<void> {
    const pending = await this.prisma.idea.findMany({
      where: { embeddingHash: null },
      take: limit,
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

        await this.prisma.$executeRawUnsafe(
          `UPDATE idea SET ai_embedding = $1::vector, embedding_hash = $2 WHERE id = $3`,
          vectorLiteral,
          hash,
          idea.id,
        );
      } catch (error) {
        this.logger.error(`Failed to sync idea ${idea.id}`, error);
      }
    }
  }

  private async processProblems(limit: number): Promise<void> {
    const pending = await this.prisma.problem.findMany({
      where: { embeddingHash: null },
      take: limit,
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

        await this.prisma.$executeRawUnsafe(
          `UPDATE problem SET ai_embedding = $1::vector, embedding_hash = $2 WHERE id = $3`,
          vectorLiteral,
          hash,
          problem.id,
        );
      } catch (error) {
        this.logger.error(`Failed to sync problem ${problem.id}`, error);
      }
    }
  }
}
