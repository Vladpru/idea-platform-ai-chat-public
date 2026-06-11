import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { AchievementKey } from './lib/achievement-criteria';

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
