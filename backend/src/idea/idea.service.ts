import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  PreconditionFailedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  IdeaStatus,
  Prisma,
  ProblemStatus,
  Stage,
  SummaryStatus,
} from '../../generated/prisma/client';
import { AchievementService } from '../achievement/achievement.service';
import { AiSummaryService } from '../ai-summary/ai-summary.service';
import {
  hasSubstantialContentChanges,
  hasSummarizableContent,
} from '../ai-summary/summary-content.util';
import { buildSummaryResetData } from '../ai-summary/summary-reset.util';
import { NOTIFICATION_EVENTS } from '../notification/events/notification-event-names';
import type { StatusChangedNotificationEvent } from '../notification/events/notification.events';
import {
  hasLifecycleChange,
  resolveActorDisplayName,
  resolveIdeaRecipientUserIds,
} from '../notification/lib/notification-integration.util';
import { PrismaService } from '../prisma/prisma.service';
import { buildStatusPublicationUpdate } from '../shared/lib/publication.util';
import { isUniqueConstraintError } from '../shared/utils/is-unique-error.util';
import { SubscriberNotificationService } from '../subscription/subscriber-notification.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDraftDto } from './dto/update-idea-draft.dto';
import { UpdatePublishedIdeaDto } from './dto/update-published-idea.dto';
import { IdeaMediaService } from './idea-media.service';
import { IDEA_FORM_INCLUDE } from './idea.constants';
import { toIdeaFormResponse } from './idea.mapper';
import type { IdeaFormResponse } from './types/idea-form.types';

export const IDEA_TITLE_MIN_LENGTH = 3;
export const IDEA_DESCRIPTION_MIN_LENGTH = 8;
export const MAX_DRAFTS_PER_USER = 20;

type PublishValidationError = {
  field: string;
  message: string;
};

type IdeaTagPayload = {
  tagIds?: string[];
  tagLabels?: string[];
};

const IDEA_NOT_FOUND = 'Idea not found';

@Injectable()
export class IdeaService {
  private readonly logger = new Logger(IdeaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ideaMediaService: IdeaMediaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly aiSummaryService: AiSummaryService,
    private readonly subscriberNotificationService: SubscriberNotificationService,
    private readonly achievementService: AchievementService,
  ) {}

  async toggleLike(ideaId: string, userId: string): Promise<void> {
    let likeAdded = false;
    let recipientUserId: string | null = null;
    let entityTitle: string | null = null;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.idea.findFirst({
        where: { id: ideaId },
        select: { id: true, status: true, authorId: true, title: true },
      });

      if (!existing) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      if (
        existing.status !== IdeaStatus.PUBLISHED &&
        existing.authorId !== userId
      ) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      const like = await tx.ideaLike.findUnique({
        where: { ideaId_userId: { ideaId, userId } },
        select: { ideaId: true, userId: true },
      });

      if (like) {
        await tx.ideaLike.delete({
          where: { ideaId_userId: { ideaId, userId } },
          select: { ideaId: true, userId: true },
        });

        await tx.idea.update({
          where: { id: ideaId },
          data: { likeCount: { decrement: 1 } },
          select: { id: true },
        });

        return;
      }

      await tx.ideaLike.create({
        data: { ideaId, userId },
        select: { ideaId: true, userId: true },
      });

      await tx.idea.update({
        where: { id: ideaId },
        data: { likeCount: { increment: 1 } },
        select: { id: true },
      });

      likeAdded = true;
      recipientUserId = existing.authorId;
      entityTitle = existing.title;
    });

    if (likeAdded && recipientUserId && recipientUserId !== userId) {
      const actorName = await resolveActorDisplayName(this.prisma, userId);

      this.eventEmitter.emit(NOTIFICATION_EVENTS.IDEA_SUPPORTER_ADDED, {
        recipientUserId,
        entityType: 'idea',
        entityId: ideaId,
        entityTitle: entityTitle ?? 'Untitled',
        actorId: userId,
        actorName,
      });
    }
  }

  private async cleanupOrphanedDraftProblems(
    tx: Prisma.TransactionClient,
    authorId: string,
    removedProblemIds: string[],
  ): Promise<void> {
    if (removedProblemIds.length === 0) return;

    await tx.problem.deleteMany({
      where: {
        id: { in: removedProblemIds },
        status: ProblemStatus.DRAFT,
        authorId,
        ideas: { none: {} },
      },
    });
  }

  private validateForPublish(projected: {
    title: string | null;
    description: string | null;
    stage: Stage | null;
    problemsCount: number;
  }): PublishValidationError[] {
    const errors: PublishValidationError[] = [];

    if (!projected.title || projected.title.length < IDEA_TITLE_MIN_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title is required and must be at least ${IDEA_TITLE_MIN_LENGTH} characters`,
      });
    }

    if (
      !projected.description ||
      projected.description.length < IDEA_DESCRIPTION_MIN_LENGTH
    ) {
      errors.push({
        field: 'description',
        message: `Description is required and must be at least ${IDEA_DESCRIPTION_MIN_LENGTH} characters`,
      });
    }

    if (projected.stage === null) {
      errors.push({
        field: 'stage',
        message: 'Stage is required',
      });
    }

    if (projected.problemsCount === 0) {
      errors.push({
        field: 'problems',
        message: 'At least one linked problem is required',
      });
    }

    return errors;
  }

  private async updateScalarFields(
    tx: Prisma.TransactionClient,
    id: string,
    dto: UpdateIdeaDraftDto,
    resetSummary: boolean,
    isPublished: boolean,
    setCompletedAt = false,
  ): Promise<void> {
    const scalarData: {
      stage?: UpdateIdeaDraftDto['stage'];
      title?: string;
      description?: string;
      completedAt?: Date | null;
      aiEmbedding?: null;
      embeddingHash?: null;
      aiSummary?: null;
      summaryStatus?: SummaryStatus;
      summaryRequestedAt?: Date | null;
    } = {};

    if ('stage' in dto && dto.stage !== undefined) scalarData.stage = dto.stage;
    if (setCompletedAt) scalarData.completedAt = new Date();
    if (dto.title !== undefined) scalarData.title = dto.title;
    if (dto.description !== undefined) scalarData.description = dto.description;

    if (dto.title !== undefined || dto.description !== undefined) {
      scalarData.aiEmbedding = null;
      scalarData.embeddingHash = null;
    }

    if (resetSummary) {
      Object.assign(scalarData, buildSummaryResetData(isPublished));
    }

    if (Object.keys(scalarData).length > 0) {
      const { aiEmbedding, ...prismaData } = scalarData;

      await tx.idea.update({
        where: { id },
        data: prismaData,
      });

      if (aiEmbedding === null) {
        try {
          await tx.$executeRaw`
            UPDATE idea SET ai_embedding = NULL WHERE id = ${id}
          `;
        } catch (error) {
          this.logger.error(
            `Failed to reset ai_embedding for idea ${id}`,
            error,
          );
        }
      }
    }
  }

  private async syncProblems(
    tx: Prisma.TransactionClient,
    id: string,
    authorId: string,
    problemIds: string[] | undefined,
  ): Promise<void> {
    if (problemIds === undefined) return;

    const currentLinks = await tx.ideaProblem.findMany({
      where: { ideaId: id },
      select: { problemId: true },
    });
    const previousProblemIds = currentLinks.map(l => l.problemId);

    const idsToRemove = previousProblemIds.filter(
      pid => !problemIds.includes(pid),
    );
    const idsToAdd = problemIds.filter(
      pid => !previousProblemIds.includes(pid),
    );

    if (idsToRemove.length > 0) {
      await tx.ideaProblem.deleteMany({
        where: {
          ideaId: id,
          problemId: { in: idsToRemove },
        },
      });
    }

    if (idsToAdd.length > 0) {
      const problems = await tx.problem.findMany({
        where: { id: { in: idsToAdd } },
        select: { id: true },
      });

      if (problems.length !== idsToAdd.length) {
        throw new BadRequestException('One or more problem IDs are invalid');
      }

      await tx.ideaProblem.createMany({
        data: idsToAdd.map(problemId => ({
          ideaId: id,
          problemId,
        })),
      });
    }

    await this.cleanupOrphanedDraftProblems(tx, authorId, idsToRemove);
  }

  private async syncTags(
    tx: Prisma.TransactionClient,
    id: string,
    dto: IdeaTagPayload,
  ): Promise<void> {
    if (dto.tagIds === undefined && !('tagLabels' in dto)) return;

    const incomingTagIds =
      dto.tagIds ?? (await this.resolveTagIdsByLabels(tx, dto));

    const currentTagLinks = await tx.ideaTag.findMany({
      where: { ideaId: id },
      select: { tagId: true },
    });
    const previousTagIds = currentTagLinks.map(l => l.tagId);

    const tagsToRemove = previousTagIds.filter(
      tagId => !incomingTagIds.includes(tagId),
    );
    const tagsToAdd = incomingTagIds.filter(
      tagId => !previousTagIds.includes(tagId),
    );

    if (tagsToRemove.length > 0) {
      await tx.ideaTag.deleteMany({
        where: {
          ideaId: id,
          tagId: { in: tagsToRemove },
        },
      });
    }

    if (tagsToAdd.length > 0) {
      const tags = await tx.tag.findMany({
        where: { id: { in: tagsToAdd } },
        select: { id: true },
      });

      if (tags.length !== tagsToAdd.length) {
        throw new BadRequestException('One or more tag IDs are invalid');
      }

      await tx.ideaTag.createMany({
        data: tagsToAdd.map(tagId => ({
          ideaId: id,
          tagId,
        })),
      });
    }
  }

  private async resolveTagIdsByLabels(
    tx: Prisma.TransactionClient,
    dto: IdeaTagPayload,
  ): Promise<string[]> {
    if (dto.tagLabels === undefined) {
      return [];
    }

    const normalizedLabels = [
      ...new Set(dto.tagLabels.map(label => label.trim())),
    ]
      .filter(Boolean)
      .slice(0, 20);

    if (normalizedLabels.length === 0) {
      return [];
    }

    const existing = await tx.tag.findMany({
      where: { name: { in: normalizedLabels } },
      select: { id: true, name: true },
    });
    const existingByName = new Map(existing.map(tag => [tag.name, tag.id]));
    const missingNames = normalizedLabels.filter(
      name => !existingByName.has(name),
    );

    if (missingNames.length > 0) {
      for (const name of missingNames) {
        const tag = await tx.tag.upsert({
          where: { name },
          update: {},
          create: { name, label: name },
          select: { id: true, name: true },
        });
        existingByName.set(tag.name, tag.id);
      }
    }

    return normalizedLabels
      .map(name => existingByName.get(name))
      .filter((tagId): tagId is string => Boolean(tagId));
  }

  private async emitIdeaStatusChanged(params: {
    ideaId: string;
    ideaTitle: string | null;
    actorId: string;
    previousStatus: string;
    previousStage: string | null;
    nextStatus: string;
    nextStage: string | null;
  }): Promise<void> {
    const [recipientUserIds, actorName] = await Promise.all([
      resolveIdeaRecipientUserIds(this.prisma, params.ideaId),
      resolveActorDisplayName(this.prisma, params.actorId),
    ]);

    const event: StatusChangedNotificationEvent = {
      entityType: 'idea',
      entityId: params.ideaId,
      entityTitle: params.ideaTitle ?? 'Untitled',
      actorId: params.actorId,
      actorName,
      recipientUserIds,
      previousStatus: params.previousStatus,
      previousStage: params.previousStage,
      nextStatus: params.nextStatus,
      nextStage: params.nextStage,
    };

    this.eventEmitter.emit(NOTIFICATION_EVENTS.STATUS_CHANGED, event);
  }

  private async findIdempotentIdea(
    id: string,
    authorId: string,
  ): Promise<IdeaFormResponse | null> {
    const existing = await this.prisma.idea.findUnique({
      where: { id },
      include: IDEA_FORM_INCLUDE,
    });

    if (!existing) {
      return null;
    }

    if (existing.authorId !== authorId) {
      throw new ConflictException('Idea id already in use');
    }

    return toIdeaFormResponse(existing, authorId);
  }

  async create(
    authorId: string,
    dto: CreateIdeaDto,
  ): Promise<IdeaFormResponse> {
    // Idempotency fast-path: a replayed offline create returns the existing row
    // and re-runs no side-effects (notifications, summaries, achievements).
    const replay = await this.findIdempotentIdea(dto.id, authorId);
    if (replay) {
      return replay;
    }

    const { isPublished, ...updateDto } = dto;

    const pendingCreate = this.prisma.$transaction(async tx => {
      const problemsToNotify: Array<{ id: string; title: string }> = [];
      let shouldNotifyIdea = false;
      if (!isPublished) {
        const currentDraftsCount = await tx.idea.count({
          where: { authorId, status: IdeaStatus.DRAFT },
        });

        if (currentDraftsCount >= MAX_DRAFTS_PER_USER) {
          throw new BadRequestException(
            `Maximum limit of ${MAX_DRAFTS_PER_USER} drafts reached. Publish or delete existing drafts.`,
          );
        }
      }

      const initialStage = dto.stage ?? null;

      let created = await tx.idea.create({
        data: {
          id: dto.id,
          authorId,
          status: IdeaStatus.DRAFT,
          ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
        },
        include: IDEA_FORM_INCLUDE,
      });

      await this.updateScalarFields(tx, created.id, updateDto, false, false);
      await this.syncProblems(tx, created.id, authorId, updateDto.problemIds);
      await this.syncTags(tx, created.id, updateDto);

      if (isPublished) {
        const projectedTitle =
          updateDto.title !== undefined ? updateDto.title : created.title;
        const projectedDescription =
          updateDto.description !== undefined
            ? updateDto.description
            : created.description;
        const projectedStage =
          updateDto.stage !== undefined ? updateDto.stage : created.stage;
        const projectedProblemsCount =
          updateDto.problemIds !== undefined ? updateDto.problemIds.length : 0;

        const errors = this.validateForPublish({
          title: projectedTitle,
          description: projectedDescription,
          stage: projectedStage,
          problemsCount: projectedProblemsCount,
        });

        if (errors.length > 0) {
          throw new UnprocessableEntityException({ errors });
        }

        let publishedProblems: Array<{
          id: string;
          title: string;
          description: string;
          valueProposition: string | null;
          category: string | null;
          impact: string | null;
        }> = [];

        if (updateDto.problemIds && updateDto.problemIds.length > 0) {
          const draftProblems = await tx.problem.findMany({
            where: {
              id: { in: updateDto.problemIds },
              status: ProblemStatus.DRAFT,
            },
            select: {
              id: true,
              title: true,
              publishedAt: true,
              description: true,
              valueProposition: true,
              category: true,
              impact: true,
            },
          });

          for (const problem of draftProblems) {
            const summarizable = hasSummarizableContent({
              entityType: 'problem',
              title: problem.title,
              description: problem.description,
              valueProposition: problem.valueProposition,
              category: problem.category,
              impact: problem.impact,
            });

            const problemPublication = buildStatusPublicationUpdate({
              publishedAt: problem.publishedAt ?? null,
              requestSummary: summarizable,
              status: ProblemStatus.PUBLISHED,
            });

            if (problemPublication.shouldNotifySubscribers) {
              problemsToNotify.push({
                id: problem.id,
                title: problem.title,
              });
            }

            await tx.problem.update({
              where: { id: problem.id },
              data: problemPublication.data,
            });
          }

          publishedProblems = draftProblems.filter(problem =>
            hasSummarizableContent({
              entityType: 'problem',
              title: problem.title,
              description: problem.description,
              valueProposition: problem.valueProposition,
              category: problem.category,
              impact: problem.impact,
            }),
          );
        }

        const requestSummary = hasSummarizableContent({
          entityType: 'idea',
          title: created.title,
          description: created.description,
        });

        const ideaPublication = buildStatusPublicationUpdate({
          publishedAt: created.publishedAt ?? null,
          requestSummary,
          status: IdeaStatus.PUBLISHED,
        });
        shouldNotifyIdea = ideaPublication.shouldNotifySubscribers;

        created = await tx.idea.update({
          where: { id: created.id },
          data: ideaPublication.data,
          include: IDEA_FORM_INCLUDE,
        });

        return {
          idea: created,
          shouldRequestSummary: requestSummary,
          publishedProblems,
          shouldNotifyIdea,
          problemsToNotify,
          publishLifecycle: isPublished
            ? {
                previousStatus: IdeaStatus.DRAFT,
                previousStage: initialStage,
              }
            : null,
        };
      } else {
        const reloaded = await tx.idea.findUnique({
          where: { id: created.id },
          include: IDEA_FORM_INCLUDE,
        });
        if (!reloaded) throw new NotFoundException(IDEA_NOT_FOUND);
        created = reloaded;
      }

      return {
        idea: created,
        shouldRequestSummary: false,
        publishedProblems: [],
        shouldNotifyIdea: false,
        problemsToNotify: [],
        publishLifecycle: null,
      };
    });

    let txResult: Awaited<typeof pendingCreate>;
    try {
      txResult = await pendingCreate;
    } catch (error) {
      // Concurrent replay race: if the row now exists and we own it, return it;
      // if it belongs to another user, findIdempotentIdea throws 409; if no row
      // with this id exists, the P2002 came from a different constraint — rethrow.
      if (isUniqueConstraintError(error)) {
        const raced = await this.findIdempotentIdea(dto.id, authorId);
        if (raced) {
          return raced;
        }
      }
      throw error;
    }

    const {
      idea,
      shouldRequestSummary,
      publishedProblems,
      publishLifecycle,
      shouldNotifyIdea,
      problemsToNotify,
    } = txResult;

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: idea.id,
    });

    if (publishLifecycle) {
      await this.emitIdeaStatusChanged({
        ideaId: idea.id,
        ideaTitle: idea.title,
        actorId: authorId,
        previousStatus: publishLifecycle.previousStatus,
        previousStage: publishLifecycle.previousStage,
        nextStatus: idea.status,
        nextStage: idea.stage,
      });

      await this.achievementService.checkAndUnlock(authorId, 'IDEA_PUBLISHED');
    }

    if (shouldNotifyIdea) {
      await this.subscriberNotificationService.notifySubscribersOfNewPublication(
        {
          authorId,
          entityType: 'idea',
          entityId: idea.id,
          entityTitle: idea.title ?? 'Untitled idea',
        },
      );
    }

    for (const problem of problemsToNotify) {
      await this.subscriberNotificationService.notifySubscribersOfNewPublication(
        {
          authorId,
          entityType: 'problem',
          entityId: problem.id,
          entityTitle: problem.title,
        },
      );
    }

    if (shouldRequestSummary) {
      this.aiSummaryService.enqueueIdeaSummary(idea.id);
    }

    this.aiSummaryService.enqueueSummariesForPublishedProblems(
      publishedProblems,
    );

    return toIdeaFormResponse(idea, authorId);
  }

  async updateDraft(
    id: string,
    authorId: string,
    expectedVersion: number,
    dto: UpdateIdeaDraftDto,
  ): Promise<IdeaFormResponse> {
    const { updated, shouldResetSummary, existing, completingNow } =
      await this.prisma.$transaction(async tx => {
        const existing = await tx.idea.findFirst({
          where: { id, authorId },
          select: {
            id: true,
            status: true,
            stage: true,
            title: true,
            description: true,
          },
        });

        if (!existing) {
          throw new NotFoundException(IDEA_NOT_FOUND);
        }

        // Optimistic concurrency: bump the version only if it still matches the
        // client's If-Match value. The CAS predicate also enforces ownership.
        const bumped = await tx.idea.updateMany({
          where: { id, authorId, version: expectedVersion },
          data: { version: { increment: 1 } },
        });

        if (bumped.count === 0) {
          const current = await tx.idea.findUnique({
            where: { id },
            include: IDEA_FORM_INCLUDE,
          });
          if (!current || current.authorId !== authorId) {
            throw new NotFoundException(IDEA_NOT_FOUND);
          }
          // Ideas are hard-deleted today, so there is no 410 path. With a future
          // soft-delete column add: if (current.deletedAt) throw GoneException.
          throw new PreconditionFailedException({
            code: 'VERSION_CONFLICT',
            current: toIdeaFormResponse(current, authorId),
          });
        }

        const resetSummary = hasSubstantialContentChanges(
          'idea',
          existing,
          dto,
        );

        const completingNow =
          dto.stage === Stage.completed && existing.stage !== Stage.completed;

        await this.updateScalarFields(
          tx,
          id,
          dto,
          resetSummary,
          existing.status === IdeaStatus.PUBLISHED,
          completingNow,
        );
        await this.syncProblems(tx, id, authorId, dto.problemIds);
        await this.syncTags(tx, id, dto);

        const record = await tx.idea.findFirst({
          where: { id, authorId },
          include: IDEA_FORM_INCLUDE,
        });

        if (!record) {
          throw new NotFoundException(IDEA_NOT_FOUND);
        }

        return {
          updated: record,
          shouldResetSummary: resetSummary,
          existing,
          completingNow,
        };
      });

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: updated.id,
    });

    if (hasLifecycleChange(existing, updated)) {
      await this.emitIdeaStatusChanged({
        ideaId: updated.id,
        ideaTitle: updated.title,
        actorId: authorId,
        previousStatus: existing.status,
        previousStage: existing.stage,
        nextStatus: updated.status,
        nextStage: updated.stage,
      });
    }

    if (shouldResetSummary && updated.status === IdeaStatus.PUBLISHED) {
      this.aiSummaryService.enqueueIdeaSummary(updated.id);
    }

    if (completingNow) {
      await this.achievementService.checkAndUnlock(authorId, 'IDEA_COMPLETED');
    }

    return toIdeaFormResponse(updated, authorId);
  }

  async updatePublished(
    id: string,
    authorId: string,
    expectedVersion: number,
    dto: UpdatePublishedIdeaDto,
  ): Promise<IdeaFormResponse> {
    const { updated, shouldResetSummary, existing, completingNow } =
      await this.prisma.$transaction(async tx => {
        const existing = await tx.idea.findFirst({
          where: { id, authorId },
          include: IDEA_FORM_INCLUDE,
        });

        if (!existing) {
          throw new NotFoundException(IDEA_NOT_FOUND);
        }

        if (existing.status !== IdeaStatus.PUBLISHED) {
          throw new BadRequestException(
            'Only published ideas can be updated via this endpoint',
          );
        }

        // Optimistic concurrency: bump the version only if it still matches the
        // client's If-Match value. The CAS predicate also enforces ownership.
        const bumped = await tx.idea.updateMany({
          where: { id, authorId, version: expectedVersion },
          data: { version: { increment: 1 } },
        });

        if (bumped.count === 0) {
          const current = await tx.idea.findUnique({
            where: { id },
            include: IDEA_FORM_INCLUDE,
          });
          if (!current || current.authorId !== authorId) {
            throw new NotFoundException(IDEA_NOT_FOUND);
          }
          throw new PreconditionFailedException({
            code: 'VERSION_CONFLICT',
            current: toIdeaFormResponse(current, authorId),
          });
        }

        const resetSummary = hasSubstantialContentChanges(
          'idea',
          existing,
          dto,
        );

        const nextTitle = dto.title !== undefined ? dto.title : existing.title;
        const nextDescription =
          dto.description !== undefined
            ? dto.description
            : existing.description;
        const nextStage = dto.stage !== undefined ? dto.stage : existing.stage;
        const nextProblemsCount =
          dto.problemIds !== undefined
            ? dto.problemIds.length
            : existing.problems.length;

        const errors = this.validateForPublish({
          title: nextTitle,
          description: nextDescription,
          stage: nextStage,
          problemsCount: nextProblemsCount,
        });

        if (errors.length > 0) {
          throw new UnprocessableEntityException({ errors });
        }

        const completingNow =
          dto.stage === Stage.completed && existing.stage !== Stage.completed;

        await this.updateScalarFields(
          tx,
          id,
          dto,
          resetSummary,
          true,
          completingNow,
        );
        await this.syncProblems(tx, id, authorId, dto.problemIds);
        await this.syncTags(tx, id, dto);

        const record = await tx.idea.findFirst({
          where: { id, authorId },
          include: IDEA_FORM_INCLUDE,
        });

        if (!record) {
          throw new NotFoundException(IDEA_NOT_FOUND);
        }

        return {
          updated: record,
          shouldResetSummary: resetSummary,
          existing,
          completingNow,
        };
      });

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: updated.id,
    });

    if (hasLifecycleChange(existing, updated)) {
      await this.emitIdeaStatusChanged({
        ideaId: updated.id,
        ideaTitle: updated.title,
        actorId: authorId,
        previousStatus: existing.status,
        previousStage: existing.stage,
        nextStatus: updated.status,
        nextStage: updated.stage,
      });
    }

    if (shouldResetSummary) {
      this.aiSummaryService.enqueueIdeaSummary(updated.id);
    }

    if (completingNow) {
      await this.achievementService.checkAndUnlock(authorId, 'IDEA_COMPLETED');
    }

    return toIdeaFormResponse(updated, authorId);
  }

  async publish(id: string, authorId: string): Promise<IdeaFormResponse> {
    const {
      published,
      shouldRequestSummary,
      publishedProblems,
      previousLifecycle,
      shouldNotifyIdea,
      problemsToNotify,
    } = await this.prisma.$transaction(async tx => {
      const problemsToNotify: Array<{ id: string; title: string }> = [];
      let shouldNotifyIdea = false;

      const idea = await tx.idea.findFirst({
        where: { id, authorId },
        include: IDEA_FORM_INCLUDE,
      });

      if (!idea) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      if (idea.status !== IdeaStatus.DRAFT) {
        if (idea.status === IdeaStatus.PUBLISHED) {
          throw new BadRequestException('Idea is already published');
        }
        if (idea.status === IdeaStatus.ARCHIVED) {
          throw new BadRequestException('Archived ideas cannot be published');
        }
        throw new BadRequestException(
          `Cannot publish idea with status: ${idea.status as string}`,
        );
      }

      const errors = this.validateForPublish({
        title: idea.title,
        description: idea.description,
        stage: idea.stage,
        problemsCount: idea.problems.length,
      });

      if (errors.length > 0) {
        throw new UnprocessableEntityException({ errors });
      }

      const linkedProblemIds = idea.problems.map(link => link.problemId);
      let publishedProblems: Array<{
        id: string;
        title: string;
        description: string;
        valueProposition: string | null;
        category: string | null;
        impact: string | null;
      }> = [];

      if (linkedProblemIds.length > 0) {
        const draftProblems = await tx.problem.findMany({
          where: {
            id: { in: linkedProblemIds },
            status: ProblemStatus.DRAFT,
          },
          select: {
            id: true,
            title: true,
            publishedAt: true,
            description: true,
            valueProposition: true,
            category: true,
            impact: true,
          },
        });

        for (const problem of draftProblems) {
          const summarizable = hasSummarizableContent({
            entityType: 'problem',
            title: problem.title,
            description: problem.description,
            valueProposition: problem.valueProposition,
            category: problem.category,
            impact: problem.impact,
          });

          const problemPublication = buildStatusPublicationUpdate({
            publishedAt: problem.publishedAt ?? null,
            requestSummary: summarizable,
            status: ProblemStatus.PUBLISHED,
          });

          if (problemPublication.shouldNotifySubscribers) {
            problemsToNotify.push({
              id: problem.id,
              title: problem.title,
            });
          }

          await tx.problem.update({
            where: { id: problem.id },
            data: problemPublication.data,
          });
        }

        publishedProblems = draftProblems.filter(problem =>
          hasSummarizableContent({
            entityType: 'problem',
            title: problem.title,
            description: problem.description,
            valueProposition: problem.valueProposition,
            category: problem.category,
            impact: problem.impact,
          }),
        );
      }

      const requestSummary = hasSummarizableContent({
        entityType: 'idea',
        title: idea.title,
        description: idea.description,
      });

      const ideaPublication = buildStatusPublicationUpdate({
        publishedAt: idea.publishedAt ?? null,
        requestSummary,
        status: IdeaStatus.PUBLISHED,
      });
      shouldNotifyIdea = ideaPublication.shouldNotifySubscribers;

      const publishedIdea = await tx.idea.update({
        where: { id },
        data: ideaPublication.data,
        include: IDEA_FORM_INCLUDE,
      });

      return {
        published: publishedIdea,
        shouldRequestSummary: requestSummary,
        publishedProblems,
        shouldNotifyIdea,
        problemsToNotify,
        previousLifecycle: {
          status: idea.status,
          stage: idea.stage,
        },
      };
    });

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: published.id,
    });

    await this.emitIdeaStatusChanged({
      ideaId: published.id,
      ideaTitle: published.title,
      actorId: authorId,
      previousStatus: previousLifecycle.status,
      previousStage: previousLifecycle.stage,
      nextStatus: published.status,
      nextStage: published.stage,
    });

    if (shouldNotifyIdea) {
      await this.subscriberNotificationService.notifySubscribersOfNewPublication(
        {
          authorId,
          entityType: 'idea',
          entityId: published.id,
          entityTitle: published.title ?? 'Untitled idea',
        },
      );
    }

    for (const problem of problemsToNotify) {
      await this.subscriberNotificationService.notifySubscribersOfNewPublication(
        {
          authorId,
          entityType: 'problem',
          entityId: problem.id,
          entityTitle: problem.title,
        },
      );
    }

    if (shouldRequestSummary) {
      this.aiSummaryService.enqueueIdeaSummary(published.id);
    }

    this.aiSummaryService.enqueueSummariesForPublishedProblems(
      publishedProblems,
    );

    await this.achievementService.checkAndUnlock(authorId, 'IDEA_PUBLISHED');

    return toIdeaFormResponse(published, authorId);
  }

  async delete(id: string, authorId: string): Promise<void> {
    const { publicIdsToDelete } = await this.prisma.$transaction(async tx => {
      const existing = await tx.idea.findFirst({
        where: { id, authorId },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      if (existing.status === IdeaStatus.ARCHIVED) {
        throw new BadRequestException('Idea is already archived');
      }

      if (
        existing.status !== IdeaStatus.DRAFT &&
        existing.status !== IdeaStatus.PUBLISHED
      ) {
        throw new BadRequestException(
          `Cannot delete idea with status: ${existing.status as string}`,
        );
      }

      const media = await tx.ideaMedia.findMany({
        where: { ideaId: id },
        select: { publicId: true },
      });
      const idsToDelete = media.map(record => record.publicId);

      const problemLinks = await tx.ideaProblem.findMany({
        where: { ideaId: id },
        select: { problemId: true },
      });
      const problemIdsToCleanup = problemLinks.map(link => link.problemId);

      await tx.ideaMedia.deleteMany({ where: { ideaId: id } });
      await tx.ideaProblem.deleteMany({ where: { ideaId: id } });
      await tx.ideaTag.deleteMany({ where: { ideaId: id } });
      await tx.idea.delete({ where: { id } });

      await this.cleanupOrphanedDraftProblems(
        tx,
        authorId,
        problemIdsToCleanup,
      );

      return { publicIdsToDelete: idsToDelete };
    });

    this.eventEmitter.emit('entity.deleted', { entityType: 'idea', id });

    this.ideaMediaService.enqueueCloudinaryDeletes(publicIdsToDelete);
  }
}
