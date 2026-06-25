import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

export interface UserContext {
  name: string;
  role: 'ADMIN' | 'MEMBER';
  memberSinceDays: number;
  contributionScore: number;
}

@Injectable()
export class UserContextService {
  private readonly logger = new Logger(UserContextService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getContext(userId: string): Promise<UserContext> {
    const [user, contributionScore] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      }),
      this.computeContributionScore(userId),
    ]);

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Anonymous';

    const memberSinceDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      name,
      role: user.role as 'ADMIN' | 'MEMBER',
      memberSinceDays,
      contributionScore,
    };
  }

  private async computeContributionScore(userId: string): Promise<number> {
    try {
      const [
        ideasAuthored,
        problemsSubmitted,
        ideaLikesReceived,
        problemLikesReceived,
      ] = await Promise.all([
        this.prisma.idea.count({ where: { authorId: userId } }),
        this.prisma.problem.count({ where: { authorId: userId } }),
        this.prisma.ideaLike.count({ where: { idea: { authorId: userId } } }),
        this.prisma.problemLike.count({
          where: { problem: { authorId: userId } },
        }),
      ]);

      return (
        ideasAuthored +
        problemsSubmitted +
        ideaLikesReceived +
        problemLikesReceived
      );
    } catch (error) {
      this.logger.error(
        'Failed to compute contribution score, defaulting to 0',
        error,
      );
      return 0;
    }
  }
}
