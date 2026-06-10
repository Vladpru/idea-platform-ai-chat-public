import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';

import { IdeaStatus, ProblemStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EntityTarget } from './entity-target.enum';
import {
  ENTITY_LIVE_CHAT_FORBIDDEN,
  IDEA_NOT_FOUND,
  PROBLEM_NOT_FOUND,
} from './entity-visibility.constants';

export type VisibleEntity = {
  authorId: string;
  title: string | null;
};

@Injectable()
export class EntityVisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisibleEntity(
    entityType: EntityTarget,
    entityId: string,
    userId: string,
  ): Promise<VisibleEntity> {
    if (entityType === EntityTarget.IDEA) {
      return this.getVisibleIdea(entityId, userId);
    }

    return this.getVisibleProblem(entityId, userId);
  }

  async getVisibleIdea(ideaId: string, userId: string): Promise<VisibleEntity> {
    const idea = await this.prisma.idea.findUnique({
      where: { id: ideaId },
      select: { status: true, authorId: true, title: true },
    });

    if (
      !idea ||
      (idea.authorId !== userId && idea.status !== IdeaStatus.PUBLISHED)
    ) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    return idea;
  }

  async getVisibleProblem(
    problemId: string,
    userId: string,
  ): Promise<VisibleEntity> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { status: true, authorId: true, title: true },
    });

    if (
      !problem ||
      (problem.authorId !== userId &&
        problem.status !== ProblemStatus.PUBLISHED)
    ) {
      throw new NotFoundException(PROBLEM_NOT_FOUND);
    }

    return problem;
  }

  async assertEntityParticipant(
    entityType: EntityTarget,
    entityId: string,
    userId: string,
  ): Promise<VisibleEntity> {
    const entity = await this.getVisibleEntity(entityType, entityId, userId);

    if (entity.authorId === userId) {
      return entity;
    }

    const isMember =
      entityType === EntityTarget.IDEA
        ? await this.prisma.ideaMember.findFirst({
            where: { ideaId: entityId, userId },
            select: { userId: true },
          })
        : await this.prisma.problemMember.findFirst({
            where: { problemId: entityId, userId },
            select: { userId: true },
          });

    if (!isMember) {
      throw new ForbiddenException(ENTITY_LIVE_CHAT_FORBIDDEN);
    }

    return entity;
  }

  async assertEntityLiveChatAccess(
    entityType: EntityTarget,
    entityId: string,
    userId: string,
  ): Promise<VisibleEntity> {
    if (entityType === EntityTarget.PROBLEM) {
      return this.getVisibleProblem(entityId, userId);
    }

    return this.assertEntityParticipant(entityType, entityId, userId);
  }
}
