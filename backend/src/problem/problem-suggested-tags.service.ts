import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { tsRankSql } from '../shared/utils/fts.util';
import { SuggestedTagsQueryDto } from './dto/suggested-tags-query.dto';
import type { SuggestedTagsResponse } from './types/suggested-tag.types';
import {
  buildProblemSearchText,
  formatTsQuery,
} from './utils/problem-fts.util';

type SuggestedTagRow = {
  name: string;
  label: string | null;
  relevance_score: number | bigint | string;
};

@Injectable()
export class ProblemSuggestedTagsService {
  private readonly logger = new Logger(ProblemSuggestedTagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSuggestedTags(
    query: SuggestedTagsQueryDto,
  ): Promise<SuggestedTagsResponse> {
    const limit = query.limit ?? 6;
    const excludeNames = (query.exclude ?? []).map(name => name.toLowerCase());
    const searchText = buildProblemSearchText(query.title, query.description);
    const formattedQuery = searchText ? formatTsQuery(searchText) : null;

    try {
      const rows = await this.fetchRankedTags({
        limit,
        excludeNames,
        formattedQuery,
      });

      return {
        data: rows.map(row => ({
          name: row.name,
          label: row.label?.trim() || row.name,
        })),
      };
    } catch (error) {
      this.logger.error('Suggested tags query failed', error as Error);
      throw error;
    }
  }

  private async fetchRankedTags(params: {
    limit: number;
    excludeNames: string[];
    formattedQuery: string | null;
  }): Promise<SuggestedTagRow[]> {
    const { limit, excludeNames, formattedQuery } = params;
    const hasExclude = excludeNames.length > 0;
    const hasFts = Boolean(formattedQuery);

    const problemMatchSql = hasFts
      ? Prisma.sql`AND p.search_vector @@ to_tsquery('english', ${formattedQuery})`
      : Prisma.empty;

    const ideaMatchSql = hasFts
      ? Prisma.sql`AND i.search_vector @@ to_tsquery('english', ${formattedQuery})`
      : Prisma.empty;

    const ftsBoostSql = hasFts
      ? Prisma.sql`+ ${tsRankSql('p.search_vector', formattedQuery ? formattedQuery : '')}`
      : Prisma.empty;

    const ideaFtsBoostSql = hasFts
      ? Prisma.sql`+ ${tsRankSql('i.search_vector', formattedQuery ? formattedQuery : '')}`
      : Prisma.empty;

    return this.prisma.$queryRaw<SuggestedTagRow[]>`
      SELECT
        t.name,
        t.label,
        (
          COALESCE((
            SELECT SUM(2 ${ftsBoostSql})
            FROM problem_tag pt
            INNER JOIN problem p ON p.id = pt.problem_id
            WHERE pt.tag_id = t.id
              AND p.status::text = 'PUBLISHED'
              ${problemMatchSql}
          ), 0)
          + COALESCE((
            SELECT SUM(1.5 ${ideaFtsBoostSql})
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
}
