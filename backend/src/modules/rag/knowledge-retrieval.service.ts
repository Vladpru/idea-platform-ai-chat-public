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

export interface KbStats {
  totalChunks: number;
  ideaChunks: number;
  problemChunks: number;
  vaultChunks: number;
  lastSyncedAt: Date | null;
  embeddingCoveragePercent: number;
}

export interface RetrieveOptions {
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  topK?: number;
  scope?: 'all' | 'entities';
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
    options: RetrieveOptions,
  ): Promise<ChunkResult[]> {
    const topK = options.topK ?? DEFAULT_TOP_K;
    const accessFilter = this.buildAccessFilter(options);
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
      return this.retrieveHybrid(query, vectorLiteral, topK, accessFilter);
    }

    return this.retrieveKeyword(query, topK, accessFilter);
  }

  private buildAccessFilter(options: RetrieveOptions): Prisma.Sql {
    const vaultCondition =
      options.scope === 'entities'
        ? Prisma.sql`FALSE`
        : options.role === 'MEMBER'
          ? Prisma.sql`(metadata->>'access' IS NULL OR metadata->>'access' != 'admin')`
          : Prisma.sql`TRUE`;

    return Prisma.sql`AND (
      CASE WHEN source LIKE 'idea:%' OR source LIKE 'problem:%'
        THEN (metadata->>'status' = 'PUBLISHED' OR metadata->>'authorId' = ${options.userId})
        ELSE ${vaultCondition}
      END
    )`;
  }

  private async retrieveHybrid(
    query: string,
    vectorLiteral: string,
    topK: number,
    accessFilter: Prisma.Sql,
  ): Promise<ChunkResult[]> {
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
        ORDER BY rank_row
        LIMIT ${CANDIDATE_LIMIT}
      ),
      keyword_search AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY ts_rank(fts_vector, websearch_to_tsquery('simple', ${query})) DESC) AS rank_row
        FROM knowledge_chunk
        WHERE fts_vector @@ websearch_to_tsquery('simple', ${query})
        ${accessFilter}
        ORDER BY rank_row
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
    accessFilter: Prisma.Sql,
  ): Promise<ChunkResult[]> {
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

  async getStats(): Promise<KbStats> {
    const [totals, lastSyncedRow] = await Promise.all([
      this.prisma.$queryRaw<
        {
          total: bigint;
          idea_chunks: bigint;
          problem_chunks: bigint;
          vault_chunks: bigint;
          with_embedding: bigint;
        }[]
      >`
        SELECT
          COUNT(*)                                                        AS total,
          COUNT(*) FILTER (WHERE source LIKE 'idea:%')                   AS idea_chunks,
          COUNT(*) FILTER (WHERE source LIKE 'problem:%')                AS problem_chunks,
          COUNT(*) FILTER (WHERE source NOT LIKE 'idea:%'
                             AND source NOT LIKE 'problem:%')            AS vault_chunks,
          COUNT(*) FILTER (WHERE embedding IS NOT NULL)                  AS with_embedding
        FROM knowledge_chunk
      `,
      this.prisma.$queryRaw<{ created_at: Date }[]>`
        SELECT created_at FROM knowledge_chunk ORDER BY created_at DESC LIMIT 1
      `,
    ]);

    const row = totals[0];
    const total = Number(row.total);
    const withEmbedding = Number(row.with_embedding);

    return {
      totalChunks: total,
      ideaChunks: Number(row.idea_chunks),
      problemChunks: Number(row.problem_chunks),
      vaultChunks: Number(row.vault_chunks),
      lastSyncedAt: lastSyncedRow[0]?.created_at ?? null,
      embeddingCoveragePercent:
        total > 0 ? Math.round((withEmbedding / total) * 100) : 0,
    };
  }
}
