import { Injectable } from '@nestjs/common';

import { ProblemStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDraftDto } from './dto/create-problem-draft.dto';

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
}
