import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { AchievementKey } from './lib/achievement-criteria';

export type ProgressCounts = {
  publishedIdeas: number;
  completedIdeas: number;
  comments: number;
  joinedProjects: number;
};

@Injectable()
export class AchievementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAchievementByKey(key: AchievementKey) {
    return this.prisma.achievement.findUnique({ where: { key } });
  }

  async findAllAchievements() {
    return this.prisma.achievement.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findUserAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
  }

  async findUserAchievementByKey(userId: string, key: AchievementKey) {
    return this.prisma.userAchievement.findFirst({
      where: { userId, achievement: { key } },
    });
  }

  async findUserAchievementByKeyAndMonth(
    userId: string,
    key: AchievementKey,
    month: string,
  ) {
    return this.prisma.userAchievement.findFirst({
      where: {
        userId,
        achievement: { key },
        metadata: { path: ['month'], equals: month },
      },
    });
  }

  async createUserAchievement(
    userId: string,
    achievementId: string,
    metadata?: { month: string },
  ) {
    return this.prisma.userAchievement.create({
      data: { userId, achievementId, metadata: metadata ?? undefined },
    });
  }

  async markAllSeen(userId: string) {
    return this.prisma.userAchievement.updateMany({
      where: { userId, seenAt: null },
      data: { seenAt: new Date() },
    });
  }

  async countProgressMetrics(userId: string): Promise<ProgressCounts> {
    const rows = await this.prisma.$queryRaw<
      [
        {
          published_ideas: bigint;
          completed_ideas: bigint;
          comments: bigint;
          joined_projects: bigint;
        },
      ]
    >(Prisma.sql`
      SELECT
        (SELECT COUNT(*) FROM "idea"
          WHERE "author_id" = ${userId} AND "status" = 'PUBLISHED')::bigint        AS published_ideas,
        (SELECT COUNT(*) FROM "idea"
          WHERE "author_id" = ${userId} AND "status" = 'PUBLISHED'
            AND "stage" = 'completed')::bigint                                      AS completed_ideas,
        (SELECT COUNT(*) FROM "comment"
          WHERE "author_id" = ${userId})::bigint                                    AS comments,
        (SELECT COUNT(*) FROM "idea_member"
          WHERE "user_id" = ${userId})::bigint                                      AS joined_projects
    `);

    const row = rows[0];
    return {
      publishedIdeas: Number(row.published_ideas),
      completedIdeas: Number(row.completed_ideas),
      comments: Number(row.comments),
      joinedProjects: Number(row.joined_projects),
    };
  }

  async countPublishedIdeas(userId: string): Promise<number> {
    return this.prisma.idea.count({
      where: { authorId: userId, status: 'PUBLISHED' },
    });
  }

  async countComments(userId: string): Promise<number> {
    return this.prisma.comment.count({ where: { authorId: userId } });
  }

  async countJoinedProjects(userId: string): Promise<number> {
    return this.prisma.ideaMember.count({ where: { userId } });
  }

  async countCompletedIdeas(userId: string): Promise<number> {
    return this.prisma.idea.count({
      where: { authorId: userId, status: 'PUBLISHED', stage: 'completed' },
    });
  }
}
