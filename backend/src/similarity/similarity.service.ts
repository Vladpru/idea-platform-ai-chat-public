import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { createHash } from 'crypto';
import { LRUCache } from 'lru-cache';

import { Prisma } from '../../generated/prisma/client';
import similarityConfig from '../config/similarity.config';
import { EmbeddingService } from '../embedding/embedding.service';
import { toPgVectorLiteral } from '../embedding/vector.util';
import { resolveIdeaFormInclude } from '../idea/idea.constants';
import { type IdeaFormRecord, toIdeaFormResponse } from '../idea/idea.mapper';
import type { IdeaFormResponseWithProblem } from '../idea/types/idea-form.types';
import { PrismaService } from '../prisma/prisma.service';
import { resolveProblemFormInclude } from '../problem/problem.constants';
import {
  type ProblemFormRecord,
  toProblemFormResponse,
} from '../problem/problem.mapper';
import type { ProblemFormResponse } from '../problem/types/problem-form.types';
import { buildSearchText } from '../shared/utils/fts.util';
import type { SimilarityEntityType } from './interfaces/find-similar-ids.params';
import type { SimilarityFindParams } from './interfaces/similarity-find.params';
import { SimilarityRepository } from './similarity.repository';

const ALLOWED_TABLES = ['idea', 'problem'] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

type EmbeddingCacheEntry = { vectorLiteral: string };

type SourceRow = {
  id: string;
  title: string | null;
  description: string | null;
  ai_embedding: string | null;
};

type ResolvedSearchInputs = {
  ftsText: string;
  vectorLiteral: string;
  vectorAvailable: boolean;
  excludeId: string | null;
};

function assertAllowedTable(value: string): asserts value is AllowedTable {
  if (!(ALLOWED_TABLES as readonly string[]).includes(value)) {
    throw new Error(`Unexpected table name: ${value}`);
  }
}

function resolveTable(entityType: SimilarityEntityType): AllowedTable {
  return entityType === 'idea' ? 'idea' : 'problem';
}

function orderByIds<T extends { id: string }>(
  ids: string[],
  records: T[],
): T[] {
  const byId = new Map(records.map(record => [record.id, record]));
  return ids
    .map(id => byId.get(id))
    .filter((record): record is T => record !== undefined);
}

@Injectable()
export class SimilarityService {
  private readonly logger = new Logger(SimilarityService.name);
  private readonly embeddingCache: LRUCache<string, EmbeddingCacheEntry>;
  private readonly resultsCache: LRUCache<string, string[]>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly similarityRepository: SimilarityRepository,
    private readonly embeddingService: EmbeddingService,
    @Inject(similarityConfig.KEY)
    similarityCfg: ConfigType<typeof similarityConfig> & {
      resultsCacheMaxSize?: number;
      resultsCacheTtlMs?: number;
    },
  ) {
    this.embeddingCache = new LRUCache<string, EmbeddingCacheEntry>({
      max: similarityCfg.embeddingCacheMaxSize,
      ttl: similarityCfg.embeddingCacheTtlMs,
    });
    this.resultsCache = new LRUCache<string, string[]>({
      max: similarityCfg.resultsCacheMaxSize ?? 500,
      ttl: similarityCfg.resultsCacheTtlMs ?? 3600000,
    });
  }

  async findSimilar(
    params: SimilarityFindParams,
  ): Promise<IdeaFormResponseWithProblem[] | ProblemFormResponse[]> {
    const sourceCacheKey = params.sourceId
      ? `result:${params.entityType}:${params.sourceId}`
      : null;

    let ids: string[] | undefined;

    if (sourceCacheKey) {
      ids = this.resultsCache.get(sourceCacheKey);
    }

    if (ids === undefined) {
      const inputs = params.sourceId
        ? await this.resolveFromSource(
            params.entityType,
            params.sourceId,
            params.userId,
          )
        : await this.resolveFromText(params.text ?? '');

      ids = await this.similarityRepository.findSimilarIds({
        entityType: params.entityType,
        vectorLiteral: inputs.vectorLiteral,
        vectorAvailable: inputs.vectorAvailable,
        ftsText: inputs.ftsText,
        excludeId: inputs.excludeId,
        limit: params.limit,
      });

      if (sourceCacheKey) {
        this.resultsCache.set(sourceCacheKey, ids);
      }
    }

    if (ids.length === 0) {
      return [];
    }

    if (params.entityType === 'idea') {
      const ideas = await this.prisma.idea.findMany({
        where: { id: { in: ids } },
        include: resolveIdeaFormInclude(params.userId),
      });
      const ordered = orderByIds(ids, ideas);
      return ordered.map(idea =>
        toIdeaFormResponse(idea as unknown as IdeaFormRecord, params.userId),
      );
    }

    const problems = await this.prisma.problem.findMany({
      where: { id: { in: ids } },
      include: resolveProblemFormInclude(params.userId),
    });
    const ordered = orderByIds(ids, problems);
    return ordered.map(problem =>
      toProblemFormResponse(
        problem as unknown as ProblemFormRecord,
        params.userId,
      ),
    );
  }

  private async resolveFromSource(
    entityType: SimilarityEntityType,
    sourceId: string,
    userId: string,
  ): Promise<ResolvedSearchInputs> {
    const tableName = resolveTable(entityType);
    assertAllowedTable(tableName);
    const table = Prisma.raw(tableName);

    const rows = await this.prisma.$queryRaw<SourceRow[]>`
      SELECT
        id,
        title,
        description,
        ai_embedding::text AS ai_embedding
      FROM ${table}
      WHERE id = ${sourceId}
        AND (status::text = 'PUBLISHED' OR author_id = ${userId})
    `;

    const row = rows[0];
    if (!row) {
      throw new NotFoundException(`${entityType} not found`);
    }

    const embeddingText = row.ai_embedding?.trim() ?? '';
    const vectorAvailable = embeddingText.length > 0;

    return {
      ftsText: buildSearchText(row.title, row.description),
      vectorLiteral: vectorAvailable ? embeddingText : '',
      vectorAvailable,
      excludeId: sourceId,
    };
  }

  private async resolveFromText(text: string): Promise<ResolvedSearchInputs> {
    const trimmed = text.trim();
    const hash = createHash('sha256').update(trimmed, 'utf8').digest('hex');
    const cached = this.embeddingCache.get(hash);

    if (cached !== undefined) {
      return {
        ftsText: trimmed,
        vectorLiteral: cached.vectorLiteral,
        vectorAvailable: true,
        excludeId: null,
      };
    }

    try {
      const vector = await this.embeddingService.embedText(trimmed);
      const vectorLiteral = toPgVectorLiteral(vector);
      this.embeddingCache.set(hash, { vectorLiteral });

      return {
        ftsText: trimmed,
        vectorLiteral,
        vectorAvailable: true,
        excludeId: null,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to embed text: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        ftsText: trimmed,
        vectorLiteral: '',
        vectorAvailable: false,
        excludeId: null,
      };
    }
  }
}
