import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  buildIdeaEmbeddingContent,
  buildProblemEmbeddingContent,
  hashEmbeddingContent,
} from './embedding-content.util';
import { EmbeddingService } from './embedding.service';
import { toPgVectorLiteral } from './vector.util';

@Injectable()
export class EmbeddingSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async syncIdeaEmbedding(ideaId: string): Promise<void> {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      select: {
        id: true,
        title: true,
        description: true,
        embeddingHash: true,
        tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!idea) {
      return;
    }

    const content = buildIdeaEmbeddingContent({
      title: idea.title,
      description: idea.description,
      tagNames: idea.tags.map(link => link.tag.name),
    });
    const hash = hashEmbeddingContent(content);

    if (hash !== null && hash === idea.embeddingHash) {
      return;
    }

    if (hash === null) {
      await this.prisma.$executeRaw`
        UPDATE idea
        SET ai_embedding = NULL, embedding_hash = NULL
        WHERE id = ${ideaId}
      `;
      return;
    }

    const vector = await this.embeddingService.embedText(content);
    const vectorLiteral = toPgVectorLiteral(vector);

    await this.prisma.$executeRaw`
      UPDATE idea
      SET ai_embedding = ${vectorLiteral}::vector, embedding_hash = ${hash}
      WHERE id = ${ideaId}
    `;
  }

  async syncProblemEmbedding(problemId: string): Promise<void> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        title: true,
        description: true,
        valueProposition: true,
        category: true,
        impact: true,
        embeddingHash: true,
        tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!problem) {
      return;
    }

    const content = buildProblemEmbeddingContent({
      title: problem.title,
      description: problem.description,
      valueProposition: problem.valueProposition,
      category: problem.category,
      impact: problem.impact,
      tagNames: problem.tags.map(link => link.tag.name),
    });
    const hash = hashEmbeddingContent(content);

    if (hash !== null && hash === problem.embeddingHash) {
      return;
    }

    if (hash === null) {
      await this.prisma.$executeRaw`
        UPDATE problem
        SET ai_embedding = NULL, embedding_hash = NULL
        WHERE id = ${problemId}
      `;
      return;
    }

    const vector = await this.embeddingService.embedText(content);
    const vectorLiteral = toPgVectorLiteral(vector);

    await this.prisma.$executeRaw`
      UPDATE problem
      SET ai_embedding = ${vectorLiteral}::vector, embedding_hash = ${hash}
      WHERE id = ${problemId}
    `;
  }
}
