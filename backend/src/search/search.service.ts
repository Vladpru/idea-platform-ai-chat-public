import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Prisma } from '../../generated/prisma/client';
import { EmbeddingService } from '../embedding/embedding.service';
import { toPgVectorLiteral } from '../embedding/vector.util';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalSearchQueryDto } from './dto/global-search-query.dto';
import {
  CountRow,
  GlobalSearchResultItem,
  GlobalSearchResultResponse,
  SearchResultRow,
} from './interfaces/search-result.interface';

const EXCERPT_LENGTH = 120;
const CANDIDATE_LIMIT = 50;
const RRF_K = 60;

const ALLOWED_ENTITY_TYPES = ['IDEA', 'PROBLEM'] as const;
type AllowedEntityType = (typeof ALLOWED_ENTITY_TYPES)[number];

const ALLOWED_TABLES = [
  'idea',
  'problem',
  'idea_media',
  'problem_media',
  'idea_tag',
  'problem_tag',
] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

const ALLOWED_FK_FIELDS = ['idea_id', 'problem_id'] as const;
type AllowedFkField = (typeof ALLOWED_FK_FIELDS)[number];

function assertAllowedTable(value: string): asserts value is AllowedTable {
  if (!(ALLOWED_TABLES as readonly string[]).includes(value)) {
    throw new Error(`Unexpected table name: ${value}`);
  }
}

function assertAllowedFkField(value: string): asserts value is AllowedFkField {
  if (!(ALLOWED_FK_FIELDS as readonly string[]).includes(value)) {
    throw new Error(`Unexpected FK field: ${value}`);
  }
}

function assertAllowedEntityType(
  value: string,
): asserts value is AllowedEntityType {
  if (!(ALLOWED_ENTITY_TYPES as readonly string[]).includes(value)) {
    throw new Error(`Unexpected entity type: ${value}`);
  }
}

function makeExcerpt(text: string | null, maxLen = EXCERPT_LENGTH): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

function isTagArray(v: unknown): v is { id: string; name: string }[] {
  return (
    Array.isArray(v) &&
    v.every((t: unknown) => {
      if (typeof t !== 'object' || t === null) return false;
      const obj = t as Record<string, unknown>;
      return typeof obj.id === 'string' && typeof obj.name === 'string';
    })
  );
}

function parseTags(raw: unknown): { id: string; name: string }[] {
  if (isTagArray(raw)) return raw;
  try {
    if (typeof raw !== 'string') return [];
    const parsed: unknown = JSON.parse(raw);
    return isTagArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapRow(
  row: SearchResultRow & { total_count?: bigint },
): GlobalSearchResultItem {
  return {
    id: row.id,
    entityType: row.entity_type,
    title: row.title,
    excerpt: makeExcerpt(row.description),
    status: row.status,
    stage: row.stage,
    createdAt: row.created_at,
    authorId: row.author_id,
    authorName:
      [row.author_first_name, row.author_last_name].filter(Boolean).join(' ') ||
      'Unknown User',
    authorAvatarUrl: row.author_avatar_url,
    imageUrl: row.image_url,
    stats: {
      views: row.view_count || 0,
      likes: row.like_count || 0,
      comments: row.comment_count || 0,
    },
    tags: parseTags(row.tags),
    isAiSuggested: Boolean(row.is_ai_suggested),
  };
}

interface EntityConfig {
  table: AllowedTable;
  mediaTable: AllowedTable;
  tagJoinTable: AllowedTable;
  fkField: AllowedFkField;
  entityType: AllowedEntityType;
}

const IDEA_CONFIG: EntityConfig = {
  table: 'idea',
  mediaTable: 'idea_media',
  tagJoinTable: 'idea_tag',
  fkField: 'idea_id',
  entityType: 'IDEA',
};

const PROBLEM_CONFIG: EntityConfig = {
  table: 'problem',
  mediaTable: 'problem_media',
  tagJoinTable: 'problem_tag',
  fkField: 'problem_id',
  entityType: 'PROBLEM',
};

type EmbeddingResult =
  | { available: true; vectorLiteral: string }
  | { available: false };

function safeBigIntToNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Number(value);
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly minSimilarity: number;
  private readonly embeddingCache = new Map<
    string,
    { vector: string; ts: number }
  >();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly config: ConfigService,
  ) {
    const raw = this.config.get<string>('SEARCH_MIN_SIMILARITY');
    if (!raw?.trim()) {
      this.logger.warn('SEARCH_MIN_SIMILARITY not set, using default 0.65');
      this.minSimilarity = 0.65;
    } else {
      const parsed = Number(raw);
      if (isNaN(parsed) || parsed < 0 || parsed > 1) {
        this.logger.warn(
          `Invalid SEARCH_MIN_SIMILARITY value "${raw}", using default 0.65`,
        );
        this.minSimilarity = 0.65;
      } else {
        this.minSimilarity = parsed;
      }
    }
  }

  async search(
    dto: GlobalSearchQueryDto,
    userId: string,
  ): Promise<GlobalSearchResultResponse> {
    const { q, page, limit, activeTab } = dto;
    const empty: GlobalSearchResultResponse = {
      data: {
        ideas: { items: [], total: 0 },
        problems: { items: [], total: 0 },
      },
      meta: { page, limit, hasNextPage: false },
    };

    const searchQuery = q;
    if (!searchQuery) return empty;

    const embedding = await this.resolveEmbedding(searchQuery);
    const offset = (page - 1) * limit;

    try {
      const [ideasData, problemsData] = await Promise.all([
        activeTab === 'ideas'
          ? this.fetchEntity(
              IDEA_CONFIG,
              searchQuery,
              embedding,
              userId,
              limit,
              offset,
            )
          : this.countEntity(IDEA_CONFIG, searchQuery, embedding, userId).then(
              res => ({
                items: [] as GlobalSearchResultItem[],
                total: res.total,
              }),
            ),
        activeTab === 'problems'
          ? this.fetchEntity(
              PROBLEM_CONFIG,
              searchQuery,
              embedding,
              userId,
              limit,
              offset,
            )
          : this.countEntity(
              PROBLEM_CONFIG,
              searchQuery,
              embedding,
              userId,
            ).then(res => ({
              items: [] as GlobalSearchResultItem[],
              total: res.total,
            })),
      ]);

      const activeTotal =
        activeTab === 'ideas' ? ideasData.total : problemsData.total;

      return {
        data: { ideas: ideasData, problems: problemsData },
        meta: { page, limit, hasNextPage: offset + limit < activeTotal },
      };
    } catch (error) {
      this.logger.error(
        'Search query failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Search is temporarily unavailable',
      );
    }
  }

  private async resolveEmbedding(
    searchQuery: string,
  ): Promise<EmbeddingResult> {
    const now = Date.now();
    const cached = this.embeddingCache.get(searchQuery);
    if (cached && now - cached.ts < this.CACHE_TTL_MS) {
      return { available: true, vectorLiteral: cached.vector };
    }

    try {
      const queryVector = await this.embeddingService.embedText(searchQuery);
      const vectorLiteral = toPgVectorLiteral(queryVector);
      this.embeddingCache.set(searchQuery, { vector: vectorLiteral, ts: now });
      this.pruneEmbeddingCache();
      return { available: true, vectorLiteral };
    } catch (error) {
      this.logger.error(
        'Embedding generation failed, falling back to keyword search',
        error instanceof Error ? error.stack : String(error),
      );
      return { available: false };
    }
  }

  private pruneEmbeddingCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.embeddingCache.entries()) {
      if (now - entry.ts > this.CACHE_TTL_MS) {
        this.embeddingCache.delete(key);
      }
    }
  }

  private getHybridCtes(
    config: EntityConfig,
    searchQuery: string,
    embedding: EmbeddingResult,
    userId: string,
  ) {
    assertAllowedTable(config.table);

    const table = Prisma.raw(config.table);

    const semanticSearch = embedding.available
      ? Prisma.sql`
            semantic_search AS (
              SELECT id, ROW_NUMBER() OVER(ORDER BY ai_embedding <=> ${embedding.vectorLiteral}::vector ASC) AS rank_row
              FROM ${table}
              WHERE ai_embedding IS NOT NULL
                AND (1 - (ai_embedding <=> ${embedding.vectorLiteral}::vector)) >= ${this.minSimilarity}
                AND (status::text = 'PUBLISHED' OR (status::text = 'DRAFT' AND author_id = ${userId}))
              LIMIT ${CANDIDATE_LIMIT}
            ),
          `
      : Prisma.sql`
            semantic_search AS (
              SELECT id, 0::bigint AS rank_row
              FROM ${table}
              WHERE false
            ),
          `;

    return Prisma.sql`
      WITH ${semanticSearch}
      keyword_search AS (
        SELECT id, ROW_NUMBER() OVER(
          ORDER BY ts_rank(
            setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(description, '')), 'B'),
            websearch_to_tsquery('simple', ${searchQuery})
          ) DESC
        ) AS rank_row
        FROM ${table}
        WHERE websearch_to_tsquery('simple', ${searchQuery}) @@ (
            setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(description, '')), 'B')
          )
          AND (status::text = 'PUBLISHED' OR (status::text = 'DRAFT' AND author_id = ${userId}))
        LIMIT ${CANDIDATE_LIMIT}
      ),
      hybrid_results AS (
        SELECT
          COALESCE(s.id, k.id) AS entity_id,
          (COALESCE(1.0 / (${RRF_K} + s.rank_row), 0.0) + COALESCE(1.0 / (${RRF_K} + k.rank_row), 0.0)) AS rrf_score
        FROM semantic_search s
        FULL OUTER JOIN keyword_search k ON s.id = k.id
      )
    `;
  }

  private getAiSuggestedCtes(
    config: EntityConfig,
    vectorLiteral: string,
    userId: string,
  ) {
    assertAllowedTable(config.table);

    const table = Prisma.raw(config.table);

    return Prisma.sql`
      WITH semantic_fallback AS (
        SELECT id, ROW_NUMBER() OVER(ORDER BY ai_embedding <=> ${vectorLiteral}::vector ASC) AS rank_row
        FROM ${table}
        WHERE ai_embedding IS NOT NULL
          AND (1 - (ai_embedding <=> ${vectorLiteral}::vector)) >= ${this.minSimilarity}
          AND (status::text = 'PUBLISHED' OR (status::text = 'DRAFT' AND author_id = ${userId}))
        LIMIT ${CANDIDATE_LIMIT}
      )
    `;
  }

  private async fetchEntity(
    config: EntityConfig,
    searchQuery: string,
    embedding: EmbeddingResult,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: GlobalSearchResultItem[]; total: number }> {
    const hybrid = await this.fetchEntityHybrid(
      config,
      searchQuery,
      embedding,
      userId,
      limit,
      offset,
    );
    if (hybrid.total > 0) return hybrid;
    if (!embedding.available) return hybrid;
    return this.fetchEntityAiSuggested(
      config,
      embedding.vectorLiteral,
      userId,
      limit,
      offset,
    );
  }

  private async fetchEntityHybrid(
    config: EntityConfig,
    searchQuery: string,
    embedding: EmbeddingResult,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: GlobalSearchResultItem[]; total: number }> {
    assertAllowedTable(config.table);
    assertAllowedTable(config.mediaTable);
    assertAllowedTable(config.tagJoinTable);
    assertAllowedFkField(config.fkField);
    assertAllowedEntityType(config.entityType);

    const ctes = this.getHybridCtes(config, searchQuery, embedding, userId);
    const table = Prisma.raw(config.table);
    const mediaTable = Prisma.raw(config.mediaTable);
    const tagJoinTable = Prisma.raw(config.tagJoinTable);
    const fkField = Prisma.raw(config.fkField);
    const entityTypeLiteral = Prisma.raw(`'${config.entityType}'`);

    const rows = await this.prisma.$queryRaw<
      (SearchResultRow & { total_count: bigint })[]
    >`
      ${ctes}
      SELECT
        e.id,
        ${entityTypeLiteral} AS entity_type,
        COALESCE(e.title, '') AS title,
        e.description,
        e.status::text AS status,
        e.stage::text AS stage,
        e.author_id,
        e.created_at,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.avatar_url AS author_avatar_url,
        media.url AS image_url,
        e.view_count,
        e.like_count,
        e.comment_count,
        COALESCE(tag_agg.tags, '[]'::json) AS tags,
        hr.rrf_score AS rank,
        false AS is_ai_suggested,
        COUNT(*) OVER() AS total_count
      FROM hybrid_results hr
      JOIN ${table} e ON e.id = hr.entity_id
      JOIN "user" u ON e.author_id = u.id
      LEFT JOIN LATERAL (
        SELECT url
        FROM ${mediaTable}
        WHERE ${fkField} = e.id AND kind = 'MAIN_IMAGE'
        ORDER BY sort_order ASC
        LIMIT 1
      ) media ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('id', t.id, 'name', t.name)) AS tags
        FROM ${tagJoinTable} jt
        JOIN tag t ON jt.tag_id = t.id
        WHERE jt.${fkField} = e.id
      ) tag_agg ON true
      ORDER BY hr.rrf_score DESC, e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map(mapRow),
      total: rows.length > 0 ? safeBigIntToNumber(rows[0].total_count) : 0,
    };
  }

  private async fetchEntityAiSuggested(
    config: EntityConfig,
    vectorLiteral: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: GlobalSearchResultItem[]; total: number }> {
    assertAllowedTable(config.table);
    assertAllowedTable(config.mediaTable);
    assertAllowedTable(config.tagJoinTable);
    assertAllowedFkField(config.fkField);
    assertAllowedEntityType(config.entityType);

    const ctes = this.getAiSuggestedCtes(config, vectorLiteral, userId);
    const table = Prisma.raw(config.table);
    const mediaTable = Prisma.raw(config.mediaTable);
    const tagJoinTable = Prisma.raw(config.tagJoinTable);
    const fkField = Prisma.raw(config.fkField);
    const entityTypeLiteral = Prisma.raw(`'${config.entityType}'`);

    const rows = await this.prisma.$queryRaw<
      (SearchResultRow & { total_count: bigint })[]
    >`
      ${ctes}
      SELECT
        e.id,
        ${entityTypeLiteral} AS entity_type,
        COALESCE(e.title, '') AS title,
        e.description,
        e.status::text AS status,
        e.stage::text AS stage,
        e.author_id,
        e.created_at,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.avatar_url AS author_avatar_url,
        media.url AS image_url,
        e.view_count,
        e.like_count,
        e.comment_count,
        COALESCE(tag_agg.tags, '[]'::json) AS tags,
        (1 - (e.ai_embedding <=> ${vectorLiteral}::vector)) AS rank,
        true AS is_ai_suggested,
        COUNT(*) OVER() AS total_count
      FROM semantic_fallback sf
      JOIN ${table} e ON e.id = sf.id
      JOIN "user" u ON e.author_id = u.id
      LEFT JOIN LATERAL (
        SELECT url
        FROM ${mediaTable}
        WHERE ${fkField} = e.id AND kind = 'MAIN_IMAGE'
        ORDER BY sort_order ASC
        LIMIT 1
      ) media ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('id', t.id, 'name', t.name)) AS tags
        FROM ${tagJoinTable} jt
        JOIN tag t ON jt.tag_id = t.id
        WHERE jt.${fkField} = e.id
      ) tag_agg ON true
      ORDER BY sf.rank_row ASC, e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      items: rows.map(mapRow),
      total: rows.length > 0 ? safeBigIntToNumber(rows[0].total_count) : 0,
    };
  }

  private async countEntity(
    config: EntityConfig,
    searchQuery: string,
    embedding: EmbeddingResult,
    userId: string,
  ): Promise<{ total: number }> {
    const ctes = this.getHybridCtes(config, searchQuery, embedding, userId);
    const [row] = await this.prisma.$queryRaw<CountRow[]>`
      ${ctes}
      SELECT COUNT(*)::bigint AS total FROM hybrid_results
    `;
    const hybridTotal = Number(row?.total?.toString() ?? '0');

    if (hybridTotal > 0) return { total: hybridTotal };
    if (!embedding.available) return { total: 0 };

    const fallbackCtes = this.getAiSuggestedCtes(
      config,
      embedding.vectorLiteral,
      userId,
    );
    const [fallbackRow] = await this.prisma.$queryRaw<CountRow[]>`
      ${fallbackCtes}
      SELECT COUNT(*)::bigint AS total FROM semantic_fallback
    `;
    return { total: Number(fallbackRow?.total?.toString() ?? '0') };
  }
}
