import { Injectable, NotFoundException } from '@nestjs/common';

import { IdeaStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  GetIdeasQueryDto,
  type IdeaSortOption,
} from './dto/get-ideas-query.dto';
import { IDEA_FORM_INCLUDE } from './idea.constants';
import { toIdeaFormResponse } from './idea.mapper';
import type {
  IdeaFormResponse,
  IdeasFeedResponse,
} from './types/idea-form.types';

const IDEA_NOT_FOUND = 'Idea not found';

@Injectable()
export class IdeaQueryService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveOrderBy(
    sort: IdeaSortOption | undefined,
    fallback: Prisma.IdeaOrderByWithRelationInput,
  ): Prisma.IdeaOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { publishedAt: 'asc' };
      case 'views':
        return { viewCount: 'desc' };
      case 'likes':
        return { likeCount: 'desc' };
      case 'comments':
        return { commentCount: 'desc' };
      case 'newest':
        return { publishedAt: 'desc' };
      default:
        return fallback;
    }
  }

  async findAllPublic(
    query: GetIdeasQueryDto,
    currentUserId?: string,
  ): Promise<IdeasFeedResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(query.limit ?? 10, 50));
    const skip = (page - 1) * limit;

    const where: Prisma.IdeaWhereInput = {
      status: IdeaStatus.PUBLISHED,
      ...(query.stage !== undefined ? { stage: query.stage } : {}),
    };

    const orderBy = this.resolveOrderBy(query.sort, { publishedAt: 'desc' });

    const [total, ideas] = await this.prisma.$transaction([
      this.prisma.idea.count({ where }),
      this.prisma.idea.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: IDEA_FORM_INCLUDE,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: ideas.map(idea => toIdeaFormResponse(idea, currentUserId)),
      meta: { total, page, limit, totalPages },
    };
  }

  async findMyIdeas(
    authorId: string,
    query: GetIdeasQueryDto,
  ): Promise<IdeasFeedResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(query.limit ?? 10, 50));
    const skip = (page - 1) * limit;

    const where: Prisma.IdeaWhereInput = {
      authorId,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.stage !== undefined ? { stage: query.stage } : {}),
    };

    const orderBy = this.resolveOrderBy(query.sort, { createdAt: 'desc' });

    const [total, ideas] = await this.prisma.$transaction([
      this.prisma.idea.count({ where }),
      this.prisma.idea.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: IDEA_FORM_INCLUDE,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: ideas.map(idea => toIdeaFormResponse(idea, authorId)),
      meta: { total, page, limit, totalPages },
    };
  }

  async findByIdSmart(id: string, userId: string): Promise<IdeaFormResponse> {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
      include: IDEA_FORM_INCLUDE,
    });

    if (!idea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    if (idea.authorId !== userId && idea.status !== IdeaStatus.PUBLISHED) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    return toIdeaFormResponse(idea, userId);
  }

  async findSimilar(
    id: string,
    currentUserId?: string,
  ): Promise<IdeaFormResponse[]> {
    const currentIdea = await this.prisma.idea.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!currentIdea || !currentIdea.title) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    const searchQuery = currentIdea.title
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .join(' | ');

    if (!searchQuery) {
      return [];
    }

    const scoredRecords = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT i.id
      FROM "idea" i
      WHERE 
        i.status = 'PUBLISHED' 
        AND i.id != ${id}
        AND to_tsvector('english', coalesce(i.title, '') || ' ' || coalesce(i.description, '')) @@ to_tsquery('english', ${searchQuery})
        AND ts_rank(
          setweight(to_tsvector('english', coalesce(i.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(i.description, '')), 'B'),
          to_tsquery('english', ${searchQuery})
        ) > 0.05
      ORDER BY ts_rank(
        setweight(to_tsvector('english', coalesce(i.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(i.description, '')), 'B'),
        to_tsquery('english', ${searchQuery})
      ) DESC, i."published_at" DESC
      LIMIT 3;
    `;

    if (scoredRecords.length === 0) {
      return [];
    }

    const similarIds = scoredRecords.map(record => record.id);

    const fullIdeas = await this.prisma.idea.findMany({
      where: {
        id: { in: similarIds },
      },
      include: IDEA_FORM_INCLUDE,
    });

    return similarIds
      .map(sampleId => fullIdeas.find(idea => idea.id === sampleId))
      .filter((idea): idea is NonNullable<typeof idea> => !!idea)
      .map(idea => toIdeaFormResponse(idea, currentUserId));
  }
}
