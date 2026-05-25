import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { IdeaStatus, Prisma } from '../../generated/prisma/client';
import type { IdeaMemberModel } from '../../generated/prisma/models/IdeaMember';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdeaMemberService {
  constructor(private readonly prisma: PrismaService) {}

  private ideaMemberKey(
    ideaId: string,
    userId: string,
  ): Prisma.IdeaMemberWhereUniqueInput {
    return { ideaId_userId: { ideaId, userId } };
  }

  async joinIdea(ideaId: string, userId: string): Promise<IdeaMemberModel> {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      select: { authorId: true, status: true },
    });

    if (!idea) {
      throw new NotFoundException();
    }

    if (idea.status !== IdeaStatus.PUBLISHED) {
      throw new BadRequestException();
    }

    if (idea.authorId === userId) {
      throw new ConflictException();
    }

    const memberKey = this.ideaMemberKey(ideaId, userId);
    const existingMember = await this.prisma.ideaMember.findUnique({
      where: memberKey,
    });

    if (existingMember) {
      throw new ConflictException();
    }

    return this.prisma.ideaMember.create({
      data: {
        ideaId,
        userId,
      },
    });
  }

  async leaveIdea(ideaId: string, userId: string): Promise<IdeaMemberModel> {
    const memberKey = this.ideaMemberKey(ideaId, userId);
    const member = await this.prisma.ideaMember.findUnique({
      where: memberKey,
    });

    if (!member) {
      throw new NotFoundException();
    }

    return this.prisma.ideaMember.delete({
      where: memberKey,
    });
  }
}
