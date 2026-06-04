import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { LRUCache } from 'lru-cache';

import { Prisma } from '../../generated/prisma/client';
import { GeminiService } from '../ai/gemini.service';
import searchConfig from '../config/search.config';
import { EmbeddingService } from '../embedding/embedding.service';
import { toPgVectorLiteral } from '../embedding/vector.util';
import { PrismaService } from '../prisma/prisma.service';
import { formatTsQuery } from '../problem/utils/problem-fts.util';
import { buildSearchText, tsRankSql } from '../shared/utils/fts.util';
import { normalizeCosineScore, normalizeSqlScore } from './tag-name.util';
import { fuseTagSuggestions } from './tag-suggestion-fusion.util';
import { TagService } from './tag.service';
import {
  DEFAULT_TAG_SUGGESTION_LIMIT,
  MIN_TAG_SUGGESTION_CONTENT_LENGTH,
  type RankedTagCandidate,
  type SuggestTagsInput,
  type SuggestTagsResponse,
  type TagSuggestionContext,
} from './types/tag-suggestion.types';

type CatalogTagRow = {
  name: string;
  label: string | null;
  relevance_score: number | bigint | string;
};

type EmbeddingTagRow = {
  name: string;
  label: string | null;
  similarity: number | string;
};

type EmbeddingCacheEntry = { vector: string; ts: number };

@Injectable()
export class TagSuggestionService {
  private readonly logger = new Logger(TagSuggestionService.name);
  private readonly embeddingCache: LRUCache<string, EmbeddingCacheEntry>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tagService: TagService,
    private readonly embeddingService: EmbeddingService,
    private readonly geminiService: GeminiService,
    @Inject(searchConfig.KEY)
    private readonly searchCfg: ConfigType<typeof searchConfig>,
  ) {
    this.embeddingCache = new LRUCache<string, EmbeddingCacheEntry>({
      max: this.searchCfg.embeddingCacheMaxSize,
      ttl: this.searchCfg.embeddingCacheTtlMs,
    });
  }

  async suggestTags(input: SuggestTagsInput): Promise<SuggestTagsResponse> {
    const limit = input.limit ?? DEFAULT_TAG_SUGGESTION_LIMIT;
    const exclude = new Set(
      (input.exclude ?? []).map(name => name.toLowerCase()),
    );
    const searchText = buildSearchText(input.title, input.description);

    if (searchText.trim().length < MIN_TAG_SUGGESTION_CONTENT_LENGTH) {
      return { data: [] };
    }

    const excludeNames = [...exclude];
    const fetchLimit = limit * 2;
    const context = input.context ?? 'problem';

    const [catalogResult, embeddingResult, catalogTags] = await Promise.all([
      this.rankByCatalogRelevance({
        searchText,
        excludeNames,
        limit: fetchLimit,
        context,
      }),
      this.rankByEmbeddingSimilarity({
        title: input.title,
        description: input.description,
        excludeNames,
        limit: fetchLimit,
      }),
      this.tagService.findAll(),
    ]);

    const catalogLabels = new Map(
      catalogTags.map(tag => [
        tag.name.toLowerCase(),
        tag.label?.trim() || tag.name,
      ]),
    );

    let aiTags: string[] = [];
    try {
      aiTags = await this.geminiService.generateSuggestedTags({
        title: input.title,
        description: input.description ?? searchText,
        knownTags: catalogTags.slice(0, 100).map(tag => tag.name),
      });
    } catch (error) {
      this.logger.warn('AI tag suggestions skipped', error as Error);
    }

    const data = fuseTagSuggestions({
      catalog: catalogResult,
      embedding: embeddingResult,
      aiTags,
      exclude,
      catalogLabels,
      limit,
    });

    return { data };
  }

  private async rankByCatalogRelevance(params: {
    searchText: string;
    excludeNames: string[];
    limit: number;
    context: TagSuggestionContext;
  }): Promise<RankedTagCandidate[]> {
    const formattedQuery = formatTsQuery(params.searchText);
    if (!formattedQuery) {
      return [];
    }

    const rows = await this.fetchCatalogRankedTags({
      limit: params.limit,
      excludeNames: params.excludeNames,
      formattedQuery,
      context: params.context,
    });

    return rows.map(row => ({
      name: row.name,
      label: row.label?.trim() || row.name,
      score: normalizeSqlScore(row.relevance_score),
      sources: ['catalog'],
    }));
  }

  private async fetchCatalogRankedTags(params: {
    limit: number;
    excludeNames: string[];
    formattedQuery: string;
    context: TagSuggestionContext;
  }): Promise<CatalogTagRow[]> {
    const { limit, excludeNames, formattedQuery, context } = params;
    const hasExclude = excludeNames.length > 0;

    const problemWeight = context === 'problem' ? 2 : 1.5;
    const ideaWeight = context === 'idea' ? 2 : 1.5;

    const problemMatchSql = Prisma.sql`AND p.search_vector @@ to_tsquery('english', ${formattedQuery})`;
    const ideaMatchSql = Prisma.sql`AND i.search_vector @@ to_tsquery('english', ${formattedQuery})`;
    const ftsBoostSql = Prisma.sql`+ ${tsRankSql('p.search_vector', formattedQuery)}`;
    const ideaFtsBoostSql = Prisma.sql`+ ${tsRankSql('i.search_vector', formattedQuery)}`;

    return this.prisma.$queryRaw<CatalogTagRow[]>`
      SELECT
        t.name,
        t.label,
        (
          COALESCE((
            SELECT SUM(${problemWeight} ${ftsBoostSql})
            FROM problem_tag pt
            INNER JOIN problem p ON p.id = pt.problem_id
            WHERE pt.tag_id = t.id
              AND p.status::text = 'PUBLISHED'
              ${problemMatchSql}
          ), 0)
          + COALESCE((
            SELECT SUM(${ideaWeight} ${ideaFtsBoostSql})
            FROM idea_tag it
            INNER JOIN idea i ON i.id = it.idea_id
            WHERE it.tag_id = t.id
              AND (i.status::text = 'PUBLISHED' OR i.stage::text <> 'ARCHIVED')
              ${ideaMatchSql}
          ), 0)
          + (
            (SELECT COUNT(*)::float FROM problem_tag WHERE tag_id = t.id)
            + (SELECT COUNT(*)::float FROM idea_tag WHERE tag_id = t.id)
          ) * 0.05
        ) AS relevance_score
      FROM tag t
      WHERE ${hasExclude ? Prisma.sql`NOT (lower(t.name) = ANY(${excludeNames}::text[]))` : Prisma.sql`TRUE`}
      ORDER BY relevance_score DESC, t.name ASC
      LIMIT ${limit}
    `;
  }

  private async rankByEmbeddingSimilarity(params: {
    title?: string;
    description?: string;
    excludeNames: string[];
    limit: number;
  }): Promise<RankedTagCandidate[]> {
    const searchText = buildSearchText(params.title, params.description);
    if (!searchText.trim()) {
      return [];
    }

    const vectorLiteral = await this.resolveQueryEmbeddingVector(searchText);
    if (!vectorLiteral) {
      return [];
    }

    try {
      const hasExclude = params.excludeNames.length > 0;
      const rows = await this.prisma.$queryRaw<EmbeddingTagRow[]>`
        SELECT
          t.name,
          t.label,
          (1 - (t.ai_embedding <=> ${vectorLiteral}::vector)) AS similarity
        FROM tag t
        WHERE t.ai_embedding IS NOT NULL
          AND (1 - (t.ai_embedding <=> ${vectorLiteral}::vector)) >= ${this.searchCfg.minSimilarity}
          ${hasExclude ? Prisma.sql`AND NOT (lower(t.name) = ANY(${params.excludeNames}::text[]))` : Prisma.empty}
        ORDER BY t.ai_embedding <=> ${vectorLiteral}::vector ASC
        LIMIT ${params.limit}
      `;

      return rows.map(row => ({
        name: row.name,
        label: row.label?.trim() || row.name,
        score: normalizeCosineScore(Number(row.similarity)),
        sources: ['embedding'],
      }));
    } catch (error) {
      this.logger.warn('Tag embedding rank query failed', error as Error);
      return [];
    }
  }

  private async resolveQueryEmbeddingVector(
    searchText: string,
  ): Promise<string | null> {
    const cached = this.embeddingCache.get(searchText);
    if (cached) {
      return cached.vector;
    }

    try {
      const queryVector = await this.embeddingService.embedText(searchText);
      const vectorLiteral = toPgVectorLiteral(queryVector);
      this.embeddingCache.set(searchText, {
        vector: vectorLiteral,
        ts: Date.now(),
      });
      return vectorLiteral;
    } catch (error) {
      this.logger.warn(
        'Query embedding failed for tag suggestions',
        error as Error,
      );
      return null;
    }
  }
}
