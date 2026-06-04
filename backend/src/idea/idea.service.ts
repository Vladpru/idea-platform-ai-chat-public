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
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDraftDto } from './dto/update-idea-draft.dto';
import { UpdatePublishedIdeaDto } from './dto/update-published-idea.dto';
import { IdeaMediaService } from './idea-media.service';
import { IDEA_FORM_INCLUDE } from './idea.constants';
import { type IdeaFormRecord, toIdeaFormResponse } from './idea.mapper';
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
        existing.authorId !== userId &&
        existing.status !== IdeaStatus.PUBLISHED
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

  private collectPublishValidationErrors(
    idea: IdeaFormRecord,
  ): PublishValidationError[] {
    const errors: PublishValidationError[] = [];

    if (!idea.title || idea.title.length < IDEA_TITLE_MIN_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title is required and must be at least ${IDEA_TITLE_MIN_LENGTH} characters`,
      });
    }

    if (
      !idea.description ||
      idea.description.length < IDEA_DESCRIPTION_MIN_LENGTH
    ) {
      errors.push({
        field: 'description',
        message: `Description is required and must be at least ${IDEA_DESCRIPTION_MIN_LENGTH} characters`,
      });
    }

    if (idea.stage === null) {
      errors.push({
        field: 'stage',
        message: 'Stage is required',
      });
    }

    if (idea.problems.length === 0) {
      errors.push({
        field: 'problems',
        message: 'At least one linked problem is required',
      });
    }

    return errors;
  }

  private collectPublishValidationErrorsFromValues(
    title: string | null,
    description: string | null,
    stage: IdeaFormRecord['stage'],
    problemsCount: number,
  ): PublishValidationError[] {
    const errors: PublishValidationError[] = [];

    if (!title || title.length < IDEA_TITLE_MIN_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title is required and must be at least ${IDEA_TITLE_MIN_LENGTH} characters`,
      });
    }

    if (!description || description.length < IDEA_DESCRIPTION_MIN_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description is required and must be at least ${IDEA_DESCRIPTION_MIN_LENGTH} characters`,
      });
    }

    if (stage === null) {
      errors.push({
        field: 'stage',
        message: 'Stage is required',
      });
    }

    if (problemsCount === 0) {
      errors.push({
        field: 'problems',
        message: 'At least one linked problem is required',
      });
    }

    return errors;
  }

  private async applyIdeaUpdates(
    tx: Prisma.TransactionClient,
    id: string,
    authorId: string,
    dto: UpdateIdeaDraftDto,
  ): Promise<void> {
    const scalarData: {
      stage?: UpdateIdeaDraftDto['stage'];
      title?: string;
      description?: string;
      aiEmbedding?: null;
      embeddingHash?: null;
    } = {};

    if ('stage' in dto && dto.stage !== undefined) scalarData.stage = dto.stage;
    if (dto.title !== undefined) scalarData.title = dto.title;
    if (dto.description !== undefined) scalarData.description = dto.description;

    if (dto.title !== undefined || dto.description !== undefined) {
      scalarData.aiEmbedding = null;
      scalarData.embeddingHash = null;
    }

    if (Object.keys(scalarData).length > 0) {
      const { aiEmbedding, ...prismaData } = scalarData;

      await tx.idea.update({
        where: { id },
        data: prismaData,
      });

      if (aiEmbedding === null) {
        await tx.$executeRaw`
          UPDATE idea SET ai_embedding = NULL WHERE id = ${id}
        `;
      }
    }

    if (dto.problemIds !== undefined) {
      const currentLinks = await tx.ideaProblem.findMany({
        where: { ideaId: id },
        select: { problemId: true },
      });
      const previousProblemIds = currentLinks.map(l => l.problemId);

      const idsToRemove = previousProblemIds.filter(
        pid => !dto.problemIds!.includes(pid),
      );
      const idsToAdd = dto.problemIds.filter(
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

    if (dto.tagIds !== undefined || 'tagLabels' in dto) {
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
      const inserted = await Promise.all(
        missingNames.map(name =>
          tx.tag.upsert({
            where: { name },
            update: {},
            create: { name, label: name },
            select: { id: true, name: true },
          }),
        ),
      );

      for (const tag of inserted) {
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

    if (!isPublished) {
      const currentDraftsCount = await this.prisma.idea.count({
        where: { authorId, status: IdeaStatus.DRAFT },
      });

      if (currentDraftsCount >= MAX_DRAFTS_PER_USER) {
        throw new BadRequestException(
          `Maximum limit of ${MAX_DRAFTS_PER_USER} drafts reached. Publish or delete existing drafts.`,
        );
      }
    }

    const idea = await this.prisma.$transaction(async tx => {
      const created = await tx.idea.create({
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

      await this.applyIdeaUpdates(tx, created.id, authorId, updateDto);

      let result = await tx.idea.findUnique({
        where: { id: created.id },
        include: IDEA_FORM_INCLUDE,
      });

      if (!result) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      if (isPublished) {
        const errors = this.collectPublishValidationErrors(result);

        if (errors.length > 0) {
          throw new UnprocessableEntityException({ errors });
        }

        const linkedProblemIds = result.problems.map(link => link.problemId);
        const publishedAt = new Date();

        if (linkedProblemIds.length > 0) {
          await tx.problem.updateMany({
            where: {
              id: { in: linkedProblemIds },
              status: ProblemStatus.DRAFT,
            },
            data: {
              status: ProblemStatus.PUBLISHED,
              publishedAt,
            },
          });
        }

        result = await tx.idea.update({
          where: { id: created.id },
          data: {
            status: IdeaStatus.PUBLISHED,
            publishedAt,
          },
          include: IDEA_FORM_INCLUDE,
        });
      }

      return result;
    });

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: idea.id,
    });

    return toIdeaFormResponse(idea, authorId);
  }

  async updateDraft(
    id: string,
    authorId: string,
    dto: UpdateIdeaDraftDto,
  ): Promise<IdeaFormResponse> {
    const idea = await this.prisma.$transaction(async tx => {
      const existing = await tx.idea.findFirst({
        where: { id, authorId },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      await this.applyIdeaUpdates(tx, id, authorId, dto);

      const updated = await tx.idea.findFirst({
        where: { id, authorId },
        include: IDEA_FORM_INCLUDE,
      });

      if (!updated) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      return updated;
    });

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: idea.id,
    });

    return toIdeaFormResponse(idea, authorId);
  }

  async updatePublished(
    id: string,
    authorId: string,
    dto: UpdatePublishedIdeaDto,
  ): Promise<IdeaFormResponse> {
    const updated = await this.prisma.$transaction(async tx => {
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

      const nextTitle = dto.title !== undefined ? dto.title : existing.title;
      const nextDescription =
        dto.description !== undefined ? dto.description : existing.description;
      const nextStage = dto.stage !== undefined ? dto.stage : existing.stage;
      const nextProblemsCount =
        dto.problemIds !== undefined
          ? dto.problemIds.length
          : existing.problems.length;

      const errors = this.collectPublishValidationErrorsFromValues(
        nextTitle,
        nextDescription,
        nextStage,
        nextProblemsCount,
      );

      if (errors.length > 0) {
        throw new UnprocessableEntityException({ errors });
      }

      await this.applyIdeaUpdates(tx, id, authorId, dto);

      const result = await tx.idea.findFirst({
        where: { id, authorId },
        include: IDEA_FORM_INCLUDE,
      });

      if (!result) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      return result;
    });

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: updated.id,
    });

    return toIdeaFormResponse(updated, authorId);
  }

  async publish(id: string, authorId: string): Promise<IdeaFormResponse> {
    const published = await this.prisma.$transaction(async tx => {
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

      const errors = this.collectPublishValidationErrors(idea);

      if (errors.length > 0) {
        throw new UnprocessableEntityException({ errors });
      }

      const linkedProblemIds = idea.problems.map(link => link.problemId);
      const publishedAt = new Date();

      if (linkedProblemIds.length > 0) {
        await tx.problem.updateMany({
          where: {
            id: { in: linkedProblemIds },
            status: ProblemStatus.DRAFT,
          },
          data: {
            status: ProblemStatus.PUBLISHED,
            publishedAt,
          },
        });
      }

      return tx.idea.update({
        where: { id },
        data: {
          status: IdeaStatus.PUBLISHED,
          publishedAt,
        },
        include: IDEA_FORM_INCLUDE,
      });
    });

    this.eventEmitter.emit('entity.mutated', {
      entityType: 'idea',
      id: published.id,
    });

    return toIdeaFormResponse(published, authorId);
  }

  async delete(id: string, authorId: string): Promise<void> {
    let publicIdsToDelete: string[] = [];

    await this.prisma.$transaction(async tx => {
      const existing = await tx.idea.findFirst({
        where: { id, authorId },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      if (existing.status === IdeaStatus.ARCHIVED) {
        throw new BadRequestException('Idea is already deleted');
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
      publicIdsToDelete = media.map(record => record.publicId);

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
    });

    this.eventEmitter.emit('entity.mutated', { entityType: 'idea', id });

    this.ideaMediaService.enqueueCloudinaryDeletes(publicIdsToDelete);
  }
}
