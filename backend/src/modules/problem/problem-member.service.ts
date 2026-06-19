import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ProblemStatus, Prisma } from '../../../generated/prisma/client';
import type { ProblemMemberModel } from '../../../generated/prisma/models/ProblemMember';
import { NOTIFICATION_EVENTS } from '../notification/events/notification-event-names';
import type { SupporterAddedNotificationEvent } from '../notification/events/notification.events';
import { resolveActorDisplayName } from '../notification/lib/notification-integration.util';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class ProblemMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private problemMemberKey(
    problemId: string,
    userId: string,
  ): Prisma.ProblemMemberWhereUniqueInput {
    return { problemId_userId: { problemId, userId } };
  }

  async joinProblem(
    problemId: string,
    userId: string,
  ): Promise<ProblemMemberModel> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { authorId: true, status: true, title: true },
    });

    if (!problem) {
      throw new NotFoundException();
    }

    if (problem.status !== ProblemStatus.PUBLISHED) {
      throw new BadRequestException();
    }

    if (problem.authorId === userId) {
      throw new ConflictException();
    }

    const memberKey = this.problemMemberKey(problemId, userId);
    const existingMember = await this.prisma.problemMember.findUnique({
      where: memberKey,
    });

    if (existingMember) {
      throw new ConflictException();
    }

    const member = await this.prisma.problemMember.create({
      data: {
        problemId,
        userId,
      },
    });

    const actorName = await resolveActorDisplayName(this.prisma, userId);

    const event: SupporterAddedNotificationEvent = {
      recipientUserId: problem.authorId,
      entityType: 'problem',
      entityId: problemId,
      entityTitle: problem.title ?? 'Untitled',
      actorId: userId,
      actorName,
    };

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PROBLEM_SUPPORTER_ADDED, event);

    return member;
  }

  async leaveProblem(
    problemId: string,
    userId: string,
  ): Promise<ProblemMemberModel> {
    const memberKey = this.problemMemberKey(problemId, userId);
    const member = await this.prisma.problemMember.findUnique({
      where: memberKey,
    });

    if (!member) {
      throw new NotFoundException();
    }

    return this.prisma.problemMember.delete({
      where: memberKey,
    });
  }
}
