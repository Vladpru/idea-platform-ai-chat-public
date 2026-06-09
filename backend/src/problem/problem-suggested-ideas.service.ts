import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { tsRankSql } from '../shared/utils/fts.util';
import { SuggestedIdeasQueryDto } from './dto/suggested-ideas-query.dto';
import type { SuggestedIdeasResponse } from './types/suggested-idea.types';
import {
  buildProblemSearchText,
  formatTsQuery,
} from './utils/problem-fts.util';

type SuggestedIdeaRow = {
  id: string;
  title: string;
  relevance_score: number | bigint | string;
};

function parseTagLabels(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

@Injectable()
export class ProblemSuggestedIdeasService {
  private readonly logger = new Logger(ProblemSuggestedIdeasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSuggestedIdeas(
    userId: string,
    query: SuggestedIdeasQueryDto,
  ): Promise<SuggestedIdeasResponse> {
    const limit = query.limit ?? 6;
    const excludeIds = query.exclude ?? [];
    const tagLabels = parseTagLabels(query.tags).map(tag => tag.toLowerCase());
    const searchText = buildProblemSearchText(query.title, query.description);
    const formattedQuery = searchText ? formatTsQuery(searchText) : null;

    try {
      const rows = await this.fetchRankedIdeas({
        userId,
        limit,
        excludeIds,
        tagLabels,
        formattedQuery,
      });

      return {
        data: rows.map(row => ({
          id: row.id,
          title: row.title?.trim() || 'Untitled idea',
        })),
      };
    } catch (error) {
      this.logger.error('Suggested ideas query failed', error as Error);
      throw error;
    }
  }

  private tagMatchScoreSql(hasTags: boolean, tagLabels: string[]) {
    if (!hasTags) {
      return Prisma.sql`0::float`;
    }

    return Prisma.sql`(
      SELECT COUNT(*)::float
      FROM idea_tag it
      INNER JOIN tag t ON t.id = it.tag_id
      WHERE it.idea_id = i.id
        AND lower(t.name) = ANY(${tagLabels}::text[])
    )`;
  }

  private async fetchRankedIdeas(params: {
    userId: string;
    limit: number;
    excludeIds: string[];
    tagLabels: string[];
    formattedQuery: string | null;
  }): Promise<SuggestedIdeaRow[]> {
    const { userId, limit, excludeIds, tagLabels, formattedQuery } = params;
    const hasExclude = excludeIds.length > 0;
    const hasTags = tagLabels.length > 0;
    const tagScoreSql = this.tagMatchScoreSql(hasTags, tagLabels);
    const ftsRankSql = formattedQuery
      ? Prisma.sql`+ ${tsRankSql('i.search_vector', formattedQuery)}`
      : Prisma.empty;

    return this.prisma.$queryRaw<SuggestedIdeaRow[]>`
      SELECT
        i.id,
        COALESCE(i.title, '') AS title,
        (
          ${tagScoreSql} * 3
          ${ftsRankSql}
          + CASE WHEN i.author_id = ${userId} THEN 1 ELSE 0 END
          + CASE WHEN i.status::text = 'PUBLISHED' THEN 0.5 ELSE 0 END
        ) AS relevance_score
      FROM idea i
      WHERE i.author_id = ${userId}
        AND (i.stage IS NULL OR i.stage::text <> 'ARCHIVED')
        ${hasExclude ? Prisma.sql`AND NOT (i.id = ANY(${excludeIds}::text[]))` : Prisma.empty}
      ORDER BY relevance_score DESC, i.created_at DESC
      LIMIT ${limit}
    `;
  }
}
