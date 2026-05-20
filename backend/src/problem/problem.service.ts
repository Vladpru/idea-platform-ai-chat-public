import { Injectable } from '@nestjs/common';

import { type Problem, ProblemStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDraftDto } from './dto/create-problem-draft.dto';
import { GetMyProblemsQueryDto } from './dto/get-my-problems-query.dto';

@Injectable()
export class ProblemService {
  constructor(private readonly prisma: PrismaService) {}

  createDraft(authorId: string, dto: CreateProblemDraftDto) {
    return this.prisma.problem.create({
      data: {
        authorId,
        title: dto.title ?? '',
        description: dto.description ?? '',
        status: ProblemStatus.DRAFT,
      },
    });
  }

  async findMine(
    authorId: string,
    query: GetMyProblemsQueryDto,
  ): Promise<Problem[]> {
    return this.prisma.problem.findMany({
      where: {
        authorId,
        ...(query.status !== undefined ? { status: query.status } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
