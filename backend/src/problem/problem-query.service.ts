import { Injectable } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProblemQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async trackUniqueView(params: {
    problemId: string;
    userId: string;
  }): Promise<void> {
    try {
      await this.prisma.$transaction(async tx => {
        await tx.problemView.create({
          data: {
            problemId: params.problemId,
            userId: params.userId,
          },
          select: { id: true },
        });

        await tx.problem.update({
          where: { id: params.problemId },
          data: { viewCount: { increment: 1 } },
          select: { id: true },
        });
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
  }
}
