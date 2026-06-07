import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
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
import { AiSummaryService } from '../ai-summary/ai-summary.service';
import {
  hasSubstantialContentChanges,
  hasSummarizableContent,
} from '../ai-summary/summary-content.util';
import { buildSummaryResetData } from '../ai-summary/summary-reset.util';
import { PrismaService } from '../prisma/prisma.service';
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
  ) {}

  async toggleLike(ideaId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.idea.findFirst({
        where: { id: ideaId },
        select: { id: true, status: true, authorId: true },
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
    });
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
  ): Promise<void> {
    const scalarData: {
      stage?: UpdateIdeaDraftDto['stage'];
      title?: string;
      description?: string;
      aiEmbedding?: null;
      embeddingHash?: null;
      aiSummary?: null;
      summaryStatus?: SummaryStatus;
      summaryRequestedAt?: Date | null;
    } = {};

    if ('stage' in dto && dto.stage !== undefined) scalarData.stage = dto.stage;
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

  async create(
    authorId: string,
    dto: CreateIdeaDto,
  ): Promise<IdeaFormResponse> {
    const { isPublished, ...updateDto } = dto;

    const { idea, shouldRequestSummary, publishedProblems } =
      await this.prisma.$transaction(async tx => {
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

        let created = await tx.idea.create({
          data: {
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
            updateDto.problemIds !== undefined
              ? updateDto.problemIds.length
              : 0;

          const errors = this.validateForPublish({
            title: projectedTitle,
            description: projectedDescription,
            stage: projectedStage,
            problemsCount: projectedProblemsCount,
          });

          if (errors.length > 0) {
            throw new UnprocessableEntityException({ errors });
          }

          const publishedAt = new Date();
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

              await tx.problem.update({
                where: { id: problem.id },
                data: {
                  status: ProblemStatus.PUBLISHED,
                  publishedAt,
                  ...buildSummaryResetData(summarizable),
                },
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

          created = await tx.idea.update({
            where: { id: created.id },
            data: {
              status: IdeaStatus.PUBLISHED,
              publishedAt,
              ...buildSummaryResetData(requestSummary),
            },
            include: IDEA_FORM_INCLUDE,
          });

          return {
            idea: created,
            shouldRequestSummary: requestSummary,
            publishedProblems,
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
        };
      });

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: idea.id,
    });

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
    dto: UpdateIdeaDraftDto,
  ): Promise<IdeaFormResponse> {
    const { updated, shouldResetSummary } = await this.prisma.$transaction(
      async tx => {
        const existing = await tx.idea.findFirst({
          where: { id, authorId },
          select: { id: true, status: true, title: true, description: true },
        });

        if (!existing) {
          throw new NotFoundException(IDEA_NOT_FOUND);
        }

        const resetSummary = hasSubstantialContentChanges(
          'idea',
          existing,
          dto,
        );

        await this.updateScalarFields(
          tx,
          id,
          dto,
          resetSummary,
          existing.status === IdeaStatus.PUBLISHED,
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

        return { updated: record, shouldResetSummary: resetSummary };
      },
    );

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: updated.id,
    });

    if (shouldResetSummary && updated.status === IdeaStatus.PUBLISHED) {
      this.aiSummaryService.enqueueIdeaSummary(updated.id);
    }

    return toIdeaFormResponse(updated, authorId);
  }

  async updatePublished(
    id: string,
    authorId: string,
    dto: UpdatePublishedIdeaDto,
  ): Promise<IdeaFormResponse> {
    const { updated, shouldResetSummary } = await this.prisma.$transaction(
      async tx => {
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

        await this.updateScalarFields(tx, id, dto, resetSummary, true);
        await this.syncProblems(tx, id, authorId, dto.problemIds);
        await this.syncTags(tx, id, dto);

        const record = await tx.idea.findFirst({
          where: { id, authorId },
          include: IDEA_FORM_INCLUDE,
        });

        if (!record) {
          throw new NotFoundException(IDEA_NOT_FOUND);
        }

        return { updated: record, shouldResetSummary: resetSummary };
      },
    );

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: updated.id,
    });

    if (shouldResetSummary) {
      this.aiSummaryService.enqueueIdeaSummary(updated.id);
    }

    return toIdeaFormResponse(updated, authorId);
  }

  async publish(id: string, authorId: string): Promise<IdeaFormResponse> {
    const { published, shouldRequestSummary, publishedProblems } =
      await this.prisma.$transaction(async tx => {
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
        const publishedAt = new Date();
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

            await tx.problem.update({
              where: { id: problem.id },
              data: {
                status: ProblemStatus.PUBLISHED,
                publishedAt,
                ...buildSummaryResetData(summarizable),
              },
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

        const publishedIdea = await tx.idea.update({
          where: { id },
          data: {
            status: IdeaStatus.PUBLISHED,
            publishedAt,
            ...buildSummaryResetData(requestSummary),
          },
          include: IDEA_FORM_INCLUDE,
        });

        return {
          published: publishedIdea,
          shouldRequestSummary: requestSummary,
          publishedProblems,
        };
      });

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: published.id,
    });

    if (shouldRequestSummary) {
      this.aiSummaryService.enqueueIdeaSummary(published.id);
    }

    this.aiSummaryService.enqueueSummariesForPublishedProblems(
      publishedProblems,
    );

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
