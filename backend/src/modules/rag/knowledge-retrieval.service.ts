import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { toPgVectorLiteral } from '../embedding/vector.util';

const DEFAULT_TOP_K = 5;

export interface ChunkResult {
  source: string;
  content: string;
  relevance: number;
}

@Injectable()
export class KnowledgeRetrievalService {
  private readonly logger = new Logger(KnowledgeRetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async retrieve(query: string, topK = DEFAULT_TOP_K): Promise<ChunkResult[]> {
    let vector: number[];
    try {
      vector = await this.embeddingService.embedText(query);
    } catch (error) {
      this.logger.error(
        'Failed to embed query for RAG retrieval',
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }

    const vectorLiteral = toPgVectorLiteral(vector);

    const rows = await this.prisma.$queryRaw<
      { source: string; content: string; relevance: number }[]
    >`
      SELECT source, content,
             1 - (embedding <=> ${vectorLiteral}::vector) AS relevance
      FROM knowledge_chunk
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${topK}
    `;

    return rows.map(row => ({
      source: row.source,
      content: row.content,
      relevance: Number(row.relevance),
    }));
  }
}
