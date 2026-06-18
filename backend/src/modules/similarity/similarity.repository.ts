import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { Prisma } from '../../../generated/prisma/client';
import similarityConfig from '../../core/config/similarity.config';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { FindSimilarIdsParams } from './interfaces/find-similar-ids.params';

const ALLOWED_TABLES = ['idea', 'problem'] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

type SimilarityIdRow = { id: string };

function assertAllowedTable(value: string): asserts value is AllowedTable {
  if (!(ALLOWED_TABLES as readonly string[]).includes(value)) {
    throw new Error(`Unexpected table name: ${value}`);
  }
}

function resolveTable(
  entityType: FindSimilarIdsParams['entityType'],
): AllowedTable {
  return entityType === 'idea' ? 'idea' : 'problem';
}

@Injectable()
export class SimilarityRepository {
  private readonly rrfK: number;
  private readonly candidateLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(similarityConfig.KEY)
    similarityCfg: ConfigType<typeof similarityConfig>,
  ) {
    this.rrfK = similarityCfg.rrfK;
    this.candidateLimit = similarityCfg.candidateLimit;
  }

  async findSimilarIds(params: FindSimilarIdsParams): Promise<string[]> {
    const tableName = resolveTable(params.entityType);
    assertAllowedTable(tableName);

    const ftsText = params.ftsText.trim();
    if (!params.vectorAvailable && ftsText.length === 0) {
      return [];
    }

    const table = Prisma.raw(tableName);
    const excludeFilter = params.excludeId
      ? Prisma.sql`AND id <> ${params.excludeId}`
      : Prisma.empty;

    const publishedStageFilter = Prisma.sql`
   status::text = 'PUBLISHED'
      AND (stage IS NULL OR stage::text <> 'archived')
    `;

    const semanticCtes = params.vectorAvailable
      ? Prisma.sql`
          sem_inner AS (
            SELECT id
            FROM ${table}
            WHERE ai_embedding IS NOT NULL
              AND ${publishedStageFilter}
              ${excludeFilter}
            ORDER BY ai_embedding <=> ${params.vectorLiteral}::vector
            LIMIT ${this.candidateLimit}
          ),
          semantic_search AS (
            SELECT id, ROW_NUMBER() OVER () AS rank_row
            FROM sem_inner
          ),
        `
      : Prisma.sql`
          semantic_search AS (
            SELECT id, 0::bigint AS rank_row
            FROM ${table}
            WHERE false
          ),
        `;

    const keywordCtes =
      ftsText.length > 0
        ? Prisma.sql`
            key_inner AS (
              SELECT id
              FROM ${table}
              WHERE search_vector @@ plainto_tsquery('english', ${ftsText})
                AND ${publishedStageFilter}
                ${excludeFilter}
              ORDER BY ts_rank(
                search_vector,
                plainto_tsquery('english', ${ftsText})
              ) DESC
              LIMIT ${this.candidateLimit}
            ),
            keyword_search AS (
              SELECT id, ROW_NUMBER() OVER () AS rank_row
              FROM key_inner
            ),
          `
        : Prisma.sql`
            keyword_search AS (
              SELECT id, 0::bigint AS rank_row
              FROM ${table}
              WHERE false
            ),
          `;

    const rows = await this.prisma.$queryRaw<SimilarityIdRow[]>`
      WITH
      ${semanticCtes}
      ${keywordCtes}
      hybrid_results AS (
        SELECT
          COALESCE(s.id, k.id) AS id,
          (
            COALESCE(1.0 / (${this.rrfK} + s.rank_row), 0.0)
            + COALESCE(1.0 / (${this.rrfK} + k.rank_row), 0.0)
          ) AS score
        FROM semantic_search s
        FULL OUTER JOIN keyword_search k ON s.id = k.id
      )
      SELECT id
      FROM hybrid_results
      ORDER BY score DESC
      LIMIT ${params.limit}
    `;

    return rows.map(row => row.id);
  }
}
