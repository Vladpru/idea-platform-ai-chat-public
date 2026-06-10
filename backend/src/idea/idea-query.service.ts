import { Injectable, NotFoundException } from '@nestjs/common';

import { IdeaStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MyIdeasQueryDto } from './dto';
import {
  GetIdeasQueryDto,
  type IdeaSortOption,
} from './dto/get-ideas-query.dto';
import { resolveIdeaFormInclude } from './idea.constants';
import { type IdeaFormRecord, toIdeaFormResponse } from './idea.mapper';
import type {
  IdeaFormResponse,
  IdeasFeedResponse,
} from './types/idea-form.types';

const IDEA_NOT_FOUND = 'Idea not found';

@Injectable()
export class IdeaQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async trackUniqueView(params: {
    ideaId: string;
    userId: string;
  }): Promise<void> {
    try {
      await this.prisma.ideaView.create({
        data: {
          ideaId: params.ideaId,
          userId: params.userId,
        },
        select: { id: true },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return;
      }
      throw e;
    }

    await this.prisma.idea.update({
      where: { id: params.ideaId },
      data: { viewCount: { increment: 1 } },
      select: { id: true },
    });
  }
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

    let authorIdFilter: Prisma.IdeaWhereInput['authorId'];
    if (query.feedOnly) {
      if (!currentUserId) {
        authorIdFilter = { in: [] };
      } else {
        const following = await this.prisma.subscription.findMany({
          where: { followerId: currentUserId },
          select: { followingId: true },
        });
        authorIdFilter = {
          in: following.map(subscription => subscription.followingId),
        };
      }
    }

    const where: Prisma.IdeaWhereInput = {
      status: IdeaStatus.PUBLISHED,
      ...(query.stage !== undefined ? { stage: query.stage } : {}),
      ...(authorIdFilter !== undefined ? { authorId: authorIdFilter } : {}),
    };

    const orderBy = this.resolveOrderBy(query.sort, { publishedAt: 'desc' });

    const [total, ideas] = await this.prisma.$transaction([
      this.prisma.idea.count({ where }),
      this.prisma.idea.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: resolveIdeaFormInclude(currentUserId),
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: ideas.map(idea =>
        toIdeaFormResponse(idea as unknown as IdeaFormRecord, currentUserId),
      ),
      meta: { total, page, limit, totalPages },
    };
  }

  async getDashboardFeed(userId: string, query: MyIdeasQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(query.limit ?? 10, 50));
    const skip = (page - 1) * limit;

    const basePublishedWhere: Prisma.IdeaWhereInput = {
      authorId: userId,
      status: IdeaStatus.PUBLISHED,
    };

    const baseDraftsWhere: Prisma.IdeaWhereInput = {
      authorId: userId,
      status: IdeaStatus.DRAFT,
    };

    const baseJoinedWhere: Prisma.IdeaWhereInput = {
      status: IdeaStatus.PUBLISHED,
      members: { some: { userId } },
    };

    const [publishedTotal, draftsTotal, joinedTotal, activeItems] =
      await this.prisma.$transaction([
        this.prisma.idea.count({ where: basePublishedWhere }),
        this.prisma.idea.count({ where: baseDraftsWhere }),
        this.prisma.idea.count({ where: baseJoinedWhere }),
        this.prisma.idea.findMany({
          where:
            query.tab === 'published'
              ? basePublishedWhere
              : query.tab === 'drafts'
                ? baseDraftsWhere
                : baseJoinedWhere,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: resolveIdeaFormInclude(userId),
        }),
      ]);

    const activeTotal =
      query.tab === 'published'
        ? publishedTotal
        : query.tab === 'drafts'
          ? draftsTotal
          : joinedTotal;

    const totalPages = activeTotal === 0 ? 0 : Math.ceil(activeTotal / limit);

    return {
      data: activeItems.map(idea =>
        toIdeaFormResponse(idea as unknown as IdeaFormRecord, userId),
      ),
      meta: {
        totals: {
          published: publishedTotal,
          drafts: draftsTotal,
          joined: joinedTotal,
        },
        page,
        limit,
        totalPages,
        hasNextPage: skip + limit < activeTotal,
      },
    };
  }

  async findByIdSmart(id: string, userId?: string): Promise<IdeaFormResponse> {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
      include: resolveIdeaFormInclude(userId),
    });

    if (!idea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    if (
      (!userId || idea.authorId !== userId) &&
      idea.status !== IdeaStatus.PUBLISHED
    ) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    return toIdeaFormResponse(idea as unknown as IdeaFormRecord, userId);
  }
}
