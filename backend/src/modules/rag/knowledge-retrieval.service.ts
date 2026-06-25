import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { toPgVectorLiteral } from '../embedding/vector.util';

const DEFAULT_TOP_K = 5;
const CANDIDATE_LIMIT = 50;
const RRF_K = 60;

export interface ChunkResult {
  source: string;
  content: string;
  relevance: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class KnowledgeRetrievalService {
  private readonly logger = new Logger(KnowledgeRetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async retrieve(
    query: string,
    topK = DEFAULT_TOP_K,
    role?: 'ADMIN' | 'MEMBER',
  ): Promise<ChunkResult[]> {
    let vectorLiteral: string | null = null;

    try {
      const vector = await this.embeddingService.embedText(query);
      vectorLiteral = toPgVectorLiteral(vector);
    } catch (error) {
      this.logger.error(
        'Failed to embed query for RAG retrieval, falling back to keyword search',
        error instanceof Error ? error.stack : String(error),
      );
    }

    if (vectorLiteral) {
      return this.retrieveHybrid(query, vectorLiteral, topK, role);
    }

    return this.retrieveKeyword(query, topK, role);
  }

  private async retrieveHybrid(
    query: string,
    vectorLiteral: string,
    topK: number,
    role?: 'ADMIN' | 'MEMBER',
  ): Promise<ChunkResult[]> {
    const accessFilter =
      role === 'MEMBER'
        ? Prisma.sql`AND (metadata->>'access' IS NULL OR metadata->>'access' != 'admin')`
        : Prisma.sql``;

    const rows = await this.prisma.$queryRaw<
      {
        source: string;
        content: string;
        relevance: number;
        metadata: unknown;
      }[]
    >`
      WITH semantic_search AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY embedding <=> ${vectorLiteral}::vector ASC) AS rank_row
        FROM knowledge_chunk
        WHERE embedding IS NOT NULL
        ${accessFilter}
        LIMIT ${CANDIDATE_LIMIT}
      ),
      keyword_search AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY ts_rank(fts_vector, websearch_to_tsquery('simple', ${query})) DESC) AS rank_row
        FROM knowledge_chunk
        WHERE fts_vector @@ websearch_to_tsquery('simple', ${query})
        ${accessFilter}
        LIMIT ${CANDIDATE_LIMIT}
      ),
      hybrid AS (
        SELECT
          COALESCE(s.id, k.id) AS id,
          (COALESCE(1.0 / (${RRF_K} + s.rank_row), 0.0) +
           COALESCE(1.0 / (${RRF_K} + k.rank_row), 0.0)) AS rrf_score
        FROM semantic_search s
        FULL OUTER JOIN keyword_search k ON s.id = k.id
      )
      SELECT kc.source, kc.content, kc.metadata, h.rrf_score AS relevance
      FROM hybrid h
      JOIN knowledge_chunk kc ON kc.id = h.id
      ORDER BY h.rrf_score DESC
      LIMIT ${topK}
    `;

    return rows.map(row => ({
      source: row.source,
      content: row.content,
      relevance: Number(row.relevance),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }));
  }

  private async retrieveKeyword(
    query: string,
    topK: number,
    role?: 'ADMIN' | 'MEMBER',
  ): Promise<ChunkResult[]> {
    const accessFilter =
      role === 'MEMBER'
        ? Prisma.sql`AND (metadata->>'access' IS NULL OR metadata->>'access' != 'admin')`
        : Prisma.sql``;

    const rows = await this.prisma.$queryRaw<
      {
        source: string;
        content: string;
        relevance: number;
        metadata: unknown;
      }[]
    >`
      SELECT source, content, metadata,
             ts_rank(fts_vector, websearch_to_tsquery('simple', ${query})) AS relevance
      FROM knowledge_chunk
      WHERE fts_vector @@ websearch_to_tsquery('simple', ${query})
      ${accessFilter}
      ORDER BY relevance DESC
      LIMIT ${topK}
    `;

    return rows.map(row => ({
      source: row.source,
      content: row.content,
      relevance: Number(row.relevance),
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }));
  }
}
