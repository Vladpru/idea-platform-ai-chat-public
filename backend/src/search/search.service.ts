import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { GlobalSearchQueryDto } from './dto/global-search-query.dto';
import {
  CountRow,
  GlobalSearchResultItem,
  GlobalSearchResultResponse,
  SearchResultRow,
} from './interfaces/search-result.interface';

const EXCERPT_LENGTH = 120;

function makeExcerpt(text: string | null, maxLen = EXCERPT_LENGTH): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

function mapRow(row: SearchResultRow): GlobalSearchResultItem {
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
    tags: (typeof row.tags === 'string'
      ? JSON.parse(row.tags)
      : row.tags || []) as { id: string; name: string }[],
  };
}
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    if (!q?.trim()) return empty;

    const formattedQuery = q
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => `${word}:*`)
      .join(' & ');

    if (!formattedQuery) return empty;

    const offset = (page - 1) * limit;

    try {
      const [ideaResult, problemResult] = await Promise.all([
        activeTab === 'ideas'
          ? this.fetchIdeas(formattedQuery, userId, limit, offset)
          : this.countIdeas(formattedQuery, userId),
        activeTab === 'problems'
          ? this.fetchProblems(formattedQuery, userId, limit, offset)
          : this.countProblems(formattedQuery, userId),
      ]);

      const ideasData =
        'items' in ideaResult
          ? ideaResult
          : { items: [] as GlobalSearchResultItem[], total: ideaResult.total };

      const problemsData =
        'items' in problemResult
          ? problemResult
          : {
              items: [] as GlobalSearchResultItem[],
              total: problemResult.total,
            };

      const activeTotal =
        activeTab === 'ideas' ? ideasData.total : problemsData.total;

      return {
        data: {
          ideas: ideasData as {
            items: GlobalSearchResultItem[];
            total: number;
          },
          problems: problemsData as {
            items: GlobalSearchResultItem[];
            total: number;
          },
        },
        meta: { page, limit, hasNextPage: offset + limit < activeTotal },
      };
    } catch (error) {
      this.logger.error('Search query failed', error as Error);
      throw error;
    }
  }
  private async fetchIdeas(
    formattedQuery: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: GlobalSearchResultItem[]; total: number }> {
    const rows = await this.prisma.$queryRaw<SearchResultRow[]>`
      WITH query AS (
        SELECT to_tsquery('english', ${formattedQuery}) AS q
      )
      SELECT
        i.id,
        'IDEA' AS entity_type,
        COALESCE(i.title, '') AS title,
        i.description,
        i.status::text AS status,
        i.stage::text AS stage,
        i.author_id,
        i.created_at,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.avatar_url AS author_avatar_url,
        (SELECT url FROM idea_media WHERE idea_id = i.id AND kind = 'MAIN_IMAGE' ORDER BY sort_order ASC LIMIT 1) AS image_url,
        i.view_count,
        i.like_count,
        i.comment_count,
        (
          SELECT COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name)), '[]'::json)
          FROM idea_tag it JOIN tag t ON it.tag_id = t.id WHERE it.idea_id = i.id
        ) AS tags,
        ts_rank(i.search_vector, query.q) AS rank,
        COUNT(*) OVER() AS total_count
      FROM idea i
      JOIN "user" u ON i.author_id = u.id,
      query
      WHERE i.search_vector @@ query.q
        AND (i.status::text = 'PUBLISHED' OR (i.status::text = 'DRAFT' AND i.author_id = ${userId}))
      ORDER BY rank DESC, i.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = rows[0]?.total_count
      ? Number(rows[0].total_count.toString())
      : 0;

    return { items: rows.map(mapRow), total };
  }

  private async fetchProblems(
    formattedQuery: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: GlobalSearchResultItem[]; total: number }> {
    const rows = await this.prisma.$queryRaw<SearchResultRow[]>`
      WITH query AS (
        SELECT to_tsquery('english', ${formattedQuery}) AS q
      )
      SELECT
        p.id,
        'PROBLEM' AS entity_type,
        p.title,
        p.description,
        p.status::text AS status,
        p.stage::text AS stage,
        p.author_id,
        p.created_at,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.avatar_url AS author_avatar_url,
        (SELECT url FROM problem_media WHERE problem_id = p.id AND kind = 'MAIN_IMAGE' ORDER BY sort_order ASC LIMIT 1) AS image_url,
        0 AS view_count,
        0 AS like_count,
        0 AS comment_count,
        (
          SELECT COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name)), '[]'::json)
          FROM problem_tag pt JOIN tag t ON pt.tag_id = t.id WHERE pt.problem_id = p.id
        ) AS tags,
        ts_rank(p.search_vector, query.q) AS rank,
        COUNT(*) OVER() AS total_count
      FROM problem p
      JOIN "user" u ON p.author_id = u.id,
      query
      WHERE p.search_vector @@ query.q
        AND (p.status::text = 'PUBLISHED' OR (p.status::text = 'DRAFT' AND p.author_id = ${userId}))
      ORDER BY rank DESC, p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = rows[0]?.total_count
      ? Number(rows[0].total_count.toString())
      : 0;

    return { items: rows.map(mapRow), total };
  }

  private async countIdeas(
    formattedQuery: string,
    userId: string,
  ): Promise<{ total: number }> {
    const [row] = await this.prisma.$queryRaw<CountRow[]>`
      WITH query AS (
        SELECT to_tsquery('english', ${formattedQuery}) AS q
      )
      SELECT COUNT(*)::bigint AS total
      FROM idea i, query
      WHERE i.search_vector @@ query.q
        AND (i.status::text = 'PUBLISHED' OR (i.status::text = 'DRAFT' AND i.author_id = ${userId}))
    `;
    return { total: Number(row?.total?.toString() ?? '0') };
  }

  private async countProblems(
    formattedQuery: string,
    userId: string,
  ): Promise<{ total: number }> {
    const [row] = await this.prisma.$queryRaw<CountRow[]>`
      WITH query AS (
        SELECT to_tsquery('english', ${formattedQuery}) AS q
      )
      SELECT COUNT(*)::bigint AS total
      FROM problem p, query
      WHERE p.search_vector @@ query.q
        AND (p.status::text = 'PUBLISHED' OR (p.status::text = 'DRAFT' AND p.author_id = ${userId}))
    `;
    return { total: Number(row?.total?.toString() ?? '0') };
  }
}
