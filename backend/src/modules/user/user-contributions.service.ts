import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { IDEA_FORM_AUTHOR_SELECT } from '../idea/idea.constants';
import type { GetContributionsQueryDto } from './dto/get-contributions-query.dto';
import type {
  UserContributionIdeaItem,
  UserContributionItem,
  UserContributionProblemItem,
  UserContributionSortRow,
  UserContributionsResponse,
  UserStatistics,
} from './types/user-contributions.types';
import {
  type HydratedContributionIdea,
  type HydratedContributionProblem,
  resolveContributionIdeaInclude,
  resolveContributionProblemInclude,
  toUserContributionIdeaItem,
  toUserContributionProblemItem,
} from './user-contributions.mapper';

type ProfileAuthorType = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

@Injectable()
export class UserContributionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getContributions(
    profileId: string,
    query: GetContributionsQueryDto,
    currentUserId?: string,
  ): Promise<UserContributionsResponse> {
    const profileAuthor = await this.prisma.user.findUnique({
      where: { id: profileId },
      select: IDEA_FORM_AUTHOR_SELECT,
    });

    if (!profileAuthor) {
      throw new NotFoundException('User not found');
    }

    const typedProfileAuthor = profileAuthor;
    const { skip, take, type, tab = 'authored' } = query;

    if (tab === 'joined') {
      return this.getJoinedContributions(
        profileId,
        type,
        skip,
        take,
        currentUserId,
        typedProfileAuthor,
      );
    }

    const unionBody = this.buildUnionBody(profileId, type);

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<UserContributionSortRow[]>`
        SELECT id, kind, "publishedAt", "createdAt"
        FROM (${unionBody}) AS contributions
        ORDER BY COALESCE("publishedAt", "createdAt") DESC
        LIMIT ${take}
        OFFSET ${skip}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count
        FROM (${unionBody}) AS contributions
      `,
    ]);

    const total = Number(countRows[0]?.count ?? 0);

    if (rows.length === 0) {
      return {
        data: [],
        meta: { skip, take, total },
      };
    }

    const ideaIds = rows.filter(row => row.kind === 'idea').map(row => row.id);
    const problemIds = rows
      .filter(row => row.kind === 'problem')
      .map(row => row.id);

    const ideas =
      ideaIds.length > 0
        ? await this.prisma.idea.findMany({
            where: { id: { in: ideaIds } },
            include: resolveContributionIdeaInclude(currentUserId),
          })
        : [];

    const problems =
      problemIds.length > 0
        ? await this.prisma.problem.findMany({
            where: { id: { in: problemIds } },
            include: resolveContributionProblemInclude(currentUserId),
          })
        : [];

    const ideaById = new Map<string, UserContributionIdeaItem>(
      ideas.map(idea => [
        idea.id,
        toUserContributionIdeaItem(
          idea as unknown as HydratedContributionIdea,
          typedProfileAuthor,
          currentUserId,
        ),
      ]),
    );

    const problemById = new Map<string, UserContributionProblemItem>(
      problems.map(problem => [
        problem.id,
        toUserContributionProblemItem(
          problem as unknown as HydratedContributionProblem,
          typedProfileAuthor,
          currentUserId,
        ),
      ]),
    );

    const data: UserContributionItem[] = [];
    for (const row of rows) {
      const item =
        row.kind === 'idea' ? ideaById.get(row.id) : problemById.get(row.id);
      if (item) data.push(item);
    }

    return {
      data,
      meta: { skip, take, total },
    };
  }

  private async getJoinedContributions(
    profileId: string,
    type: string,
    skip: number,
    take: number,
    currentUserId: string | undefined,
    profileAuthor: ProfileAuthorType,
  ): Promise<UserContributionsResponse> {
    const fetchIdeas = type === 'all' || type === 'idea';
    const fetchProblems = type === 'all' || type === 'problem';

    const [ideas, problems] = await Promise.all([
      fetchIdeas
        ? this.prisma.idea.findMany({
            where: {
              status: 'PUBLISHED',
              authorId: { not: profileId },
              members: { some: { userId: profileId } },
            },
            include: resolveContributionIdeaInclude(currentUserId),
          })
        : Promise.resolve([]),
      fetchProblems
        ? this.prisma.problem.findMany({
            where: {
              status: 'PUBLISHED',
              authorId: { not: profileId },
              members: { some: { userId: profileId } },
            },
            include: resolveContributionProblemInclude(currentUserId),
          })
        : Promise.resolve([]),
    ]);

    const allItems: UserContributionItem[] = [
      ...ideas.map(idea =>
        toUserContributionIdeaItem(
          idea as unknown as HydratedContributionIdea,
          profileAuthor,
          currentUserId,
        ),
      ),
      ...problems.map(problem =>
        toUserContributionProblemItem(
          problem as unknown as HydratedContributionProblem,
          profileAuthor,
          currentUserId,
        ),
      ),
    ];

    allItems.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      return dateB - dateA;
    });

    const total = allItems.length;
    const pagedItems = allItems.slice(skip, skip + take);

    return {
      data: pagedItems,
      meta: { skip, take, total },
    };
  }

  private buildUnionBody(profileId: string, type: string): Prisma.Sql {
    const ideaSelect = Prisma.sql`
      SELECT i.id, 'idea'::text AS kind, i.published_at AS "publishedAt", i.created_at AS "createdAt"
      FROM idea i
      WHERE i.author_id = CAST(${profileId} AS TEXT) AND i.status::text = 'PUBLISHED'
    `;

    const problemSelect = Prisma.sql`
      SELECT p.id, 'problem'::text AS kind, p.published_at AS "publishedAt", p.created_at AS "createdAt"
      FROM problem p
      WHERE p.author_id = CAST(${profileId} AS TEXT) AND p.status::text = 'PUBLISHED'
    `;

    if (type === 'idea') return ideaSelect;
    if (type === 'problem') return problemSelect;

    return Prisma.sql`${ideaSelect} UNION ALL ${problemSelect}`;
  }

  async getUserStatistics(userId: string): Promise<UserStatistics> {
    const [ideaStats, problemStats] = await Promise.all([
      this.prisma.idea.aggregate({
        where: { authorId: userId, status: 'PUBLISHED' },
        _count: { id: true },
        _sum: { viewCount: true, likeCount: true },
      }),
      this.prisma.problem.aggregate({
        where: { authorId: userId, status: 'PUBLISHED' },
        _count: { id: true },
        _sum: { viewCount: true, likeCount: true },
      }),
    ]);

    return {
      ideas: ideaStats._count.id || 0,
      problems: problemStats._count.id || 0,
      totalViews:
        (ideaStats._sum.viewCount || 0) + (problemStats._sum.viewCount || 0),
      totalLikes:
        (ideaStats._sum.likeCount || 0) + (problemStats._sum.likeCount || 0),
    };
  }
}
