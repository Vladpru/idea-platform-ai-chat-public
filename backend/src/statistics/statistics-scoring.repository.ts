import { Injectable } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SCORING_WEIGHTS } from '../shared/types/scoring.types';
import type {
  LeaderboardEntry,
  MyScore,
  StatisticsContributor,
} from '../shared/types/statistics.types';
import type {
  LeaderboardScoreRow,
  UserScoreBreakdownRow,
} from './lib/query/query.types';
import { buildScoreActivityCte } from './lib/query/score-activity.util';
import {
  SCORE_CATEGORY_DEFINITIONS,
  formatScoreCategoryCountLabel,
} from './lib/scoring/score-category.util';
import { formatContributorName } from './lib/scoring/user-name.util';

@Injectable()
export class StatisticsScoringRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMyScore(userId: string, start: Date, end: Date): Promise<MyScore> {
    const weights = DEFAULT_SCORING_WEIGHTS;
    const activityCte = buildScoreActivityCte(start, end, weights);

    const rows = await this.prisma.$queryRaw<UserScoreBreakdownRow[]>`
      WITH activity AS (${activityCte})
      SELECT
        COALESCE(COUNT(*) FILTER (WHERE category = 'ideas'), 0)::bigint AS ideas_count,
        COALESCE(SUM(points) FILTER (WHERE category = 'ideas'), 0)::bigint AS ideas_points,
        COALESCE(COUNT(*) FILTER (WHERE category = 'updates'), 0)::bigint AS updates_count,
        COALESCE(SUM(points) FILTER (WHERE category = 'updates'), 0)::bigint AS updates_points,
        COALESCE(COUNT(*) FILTER (WHERE category = 'joinedProjects'), 0)::bigint AS joined_projects_count,
        COALESCE(SUM(points) FILTER (WHERE category = 'joinedProjects'), 0)::bigint AS joined_projects_points,
        COALESCE(COUNT(*) FILTER (WHERE category = 'comments'), 0)::bigint AS comments_count,
        COALESCE(SUM(points) FILTER (WHERE category = 'comments'), 0)::bigint AS comments_points,
        COALESCE(COUNT(*) FILTER (WHERE category = 'views'), 0)::bigint AS views_count,
        COALESCE(SUM(points) FILTER (WHERE category = 'views'), 0)::bigint AS views_points,
        COALESCE(COUNT(*) FILTER (WHERE category = 'likes'), 0)::bigint AS likes_count,
        COALESCE(SUM(points) FILTER (WHERE category = 'likes'), 0)::bigint AS likes_points
      FROM activity
      WHERE user_id = ${userId}
    `;

    const row = rows[0];
    const breakdown = {
      ideas: {
        count: Number(row?.ideas_count ?? 0),
        points: Number(row?.ideas_points ?? 0),
      },
      updates: {
        count: Number(row?.updates_count ?? 0),
        points: Number(row?.updates_points ?? 0),
      },
      joinedProjects: {
        count: Number(row?.joined_projects_count ?? 0),
        points: Number(row?.joined_projects_points ?? 0),
      },
      comments: {
        count: Number(row?.comments_count ?? 0),
        points: Number(row?.comments_points ?? 0),
      },
      views: {
        count: Number(row?.views_count ?? 0),
        points: Number(row?.views_points ?? 0),
      },
      likes: {
        count: Number(row?.likes_count ?? 0),
        points: Number(row?.likes_points ?? 0),
      },
    };

    const categories = SCORE_CATEGORY_DEFINITIONS.map(definition => {
      const stats = breakdown[definition.key];

      return {
        key: definition.key,
        label: definition.label,
        count: stats.count,
        points: stats.points,
        countLabel: formatScoreCategoryCountLabel(stats.count, definition),
      };
    });

    const totalPoints = categories.reduce(
      (sum, category) => sum + category.points,
      0,
    );

    return { totalPoints, categories };
  }

  async getTopContributors(
    start: Date,
    end: Date,
  ): Promise<StatisticsContributor[]> {
    const entries = await this.queryLeaderboardEntries(start, end, 5);

    return entries.map(({ id, name, points, avatarUrl }) => ({
      id,
      name,
      points,
      avatarUrl,
    }));
  }

  async queryLeaderboardEntries(
    start: Date,
    end: Date,
    limit?: number,
  ): Promise<LeaderboardEntry[]> {
    const weights = DEFAULT_SCORING_WEIGHTS;
    const activityCte = buildScoreActivityCte(start, end, weights);
    const limitSql =
      typeof limit === 'number' ? Prisma.sql`LIMIT ${limit}` : Prisma.empty;

    const ranked = await this.prisma.$queryRaw<LeaderboardScoreRow[]>`
      WITH activity AS (${activityCte})
      SELECT
        user_id,
        SUM(points)::bigint AS total,
        COALESCE(SUM(points) FILTER (WHERE category = 'ideas'), 0)::bigint AS ideas,
        COALESCE(SUM(points) FILTER (WHERE category = 'updates'), 0)::bigint AS updates,
        COALESCE(SUM(points) FILTER (WHERE category = 'joinedProjects'), 0)::bigint AS joined_projects,
        COALESCE(SUM(points) FILTER (WHERE category = 'comments'), 0)::bigint AS comments,
        COALESCE(SUM(points) FILTER (WHERE category = 'views'), 0)::bigint AS views,
        COALESCE(SUM(points) FILTER (WHERE category = 'likes'), 0)::bigint AS likes
      FROM activity
      GROUP BY user_id
      HAVING SUM(points) > 0
      ORDER BY total DESC
      ${limitSql}
    `;

    if (ranked.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: ranked.map(row => row.user_id) } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    const usersById = new Map(users.map(user => [user.id, user]));

    return ranked.map(row => {
      const user = usersById.get(row.user_id);

      return {
        id: row.user_id,
        name: formatContributorName(user),
        points: Number(row.total),
        avatarUrl: user?.avatarUrl ?? null,
        breakdown: {
          ideas: Number(row.ideas),
          updates: Number(row.updates),
          joinedProjects: Number(row.joined_projects),
          comments: Number(row.comments),
          views: Number(row.views),
          likes: Number(row.likes),
        },
      };
    });
  }
}
