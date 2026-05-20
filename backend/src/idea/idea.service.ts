import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import {
  IdeaStatus,
  MediaKind,
  MediaProvider,
  Prisma,
  ProblemStatus,
} from '../../generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { GetIdeasQueryDto } from './dto/get-ideas-query.dto';
import { UpdateIdeaDraftDto } from './dto/update-idea-draft.dto';
import { UpdatePublishedIdeaDto } from './dto/update-published-idea.dto';
import { IDEA_FORM_INCLUDE } from './idea.constants';
import { type IdeaFormRecord, toIdeaFormResponse } from './idea.mapper';
import type {
  IdeaFormResponse,
  IdeasFeedResponse,
} from './types/idea-form.types';
import { convertToSearchQuery } from './utils/fts.util';

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

const ALLOWED_UPLOAD_STATUSES: IdeaStatus[] = [
  IdeaStatus.DRAFT,
  IdeaStatus.PUBLISHED,
];

@Injectable()
export class IdeaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

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

  private async applyIdeaUpdates(
    tx: Prisma.TransactionClient,
    id: string,
    authorId: string,
    dto: UpdateIdeaDraftDto | UpdatePublishedIdeaDto,
  ): Promise<void> {
    const scalarData: {
      stage?: UpdateIdeaDraftDto['stage'];
      title?: string;
      description?: string;
    } = {};

    if ('stage' in dto && dto.stage !== undefined) scalarData.stage = dto.stage;
    if (dto.title !== undefined) scalarData.title = dto.title;
    if (dto.description !== undefined) scalarData.description = dto.description;

    if (Object.keys(scalarData).length > 0) {
      await tx.idea.update({
        where: { id },
        data: scalarData,
      });
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

  async createDraft(
    authorId: string,
    dto: CreateIdeaDto,
  ): Promise<IdeaFormResponse> {
    const currentDraftsCount = await this.prisma.idea.count({
      where: { authorId, status: IdeaStatus.DRAFT },
    });

    if (currentDraftsCount >= MAX_DRAFTS_PER_USER) {
      throw new BadRequestException(
        `Maximum limit of ${MAX_DRAFTS_PER_USER} drafts reached. Publish or delete existing drafts.`,
      );
    }

    const idea = await this.prisma.$transaction(async tx => {
      const created = await tx.idea.create({
        data: {
          authorId,
          status: IdeaStatus.DRAFT,
          ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
        },
        include: IDEA_FORM_INCLUDE,
      });

      await this.applyIdeaUpdates(tx, created.id, authorId, dto);

      const result = await tx.idea.findUnique({
        where: { id: created.id },
        include: IDEA_FORM_INCLUDE,
      });

      if (!result) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }

      return result;
    });

    return toIdeaFormResponse(idea);
  }

  private async resolveTagIdsByLabels(
    tx: Prisma.TransactionClient,
    dto: IdeaTagPayload,
  ): Promise<string[]> {
    if (dto.tagLabels === undefined) {
      return [];
    }

    const normalizedLabels = [...new Set(dto.tagLabels.map(label => label.trim()))]
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
    const missingNames = normalizedLabels.filter(name => !existingByName.has(name));

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

  async uploadAttachment(
    id: string,
    authorId: string,
    file: Express.Multer.File,
  ): Promise<IdeaFormResponse> {
    const idea = await this.prisma.idea.findFirst({
      where: { id, authorId },
      select: { id: true, status: true },
    });

    if (!idea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    if (!ALLOWED_UPLOAD_STATUSES.includes(idea.status)) {
      throw new BadRequestException(
        'Attachment upload is only allowed for draft or published ideas',
      );
    }

    const uploaded = await this.cloudinary.uploadIdeaAttachment(file, id);

    try {
      const existingCount = await this.prisma.ideaMedia.count({
        where: { ideaId: id, kind: MediaKind.ATTACHMENT },
      });

      await this.prisma.ideaMedia.create({
        data: {
          ideaId: id,
          kind: MediaKind.ATTACHMENT,
          provider: MediaProvider.CLOUDINARY,
          url: uploaded.url,
          publicId: uploaded.publicId,
          mimeType: file.mimetype,
          byteSize: file.size,
          originalFilename: file.originalname || 'attachment',
          sortOrder: existingCount,
        },
      });
    } catch (err) {
      await this.cloudinary.deleteByPublicId(uploaded.publicId).catch(() => {});
      throw err;
    }

    return this.findByIdSmart(id, authorId);
  }

  async deleteMedia(id: string, mediaId: string, authorId: string): Promise<void> {
    const idea = await this.prisma.idea.findFirst({
      where: { id, authorId },
      select: { id: true },
    });

    if (!idea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    const media = await this.prisma.ideaMedia.findFirst({
      where: { id: mediaId, ideaId: id },
      select: { id: true, publicId: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    await this.prisma.ideaMedia.delete({ where: { id: mediaId } });
    void this.cloudinary.deleteByPublicId(media.publicId);
  }
  async findAllPublic(query: GetIdeasQueryDto): Promise<IdeasFeedResponse> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.IdeaWhereInput = {
      status: IdeaStatus.PUBLISHED,
      ...(query.stage !== undefined ? { stage: query.stage } : {}),
    };

    const [total, ideas] = await this.prisma.$transaction([
      this.prisma.idea.count({ where }),
      this.prisma.idea.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: IDEA_FORM_INCLUDE,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: ideas.map(toIdeaFormResponse),
      meta: { total, page, limit, totalPages },
    };
  }

  async findMyIdeas(
    authorId: string,
    query: GetIdeasQueryDto,
  ): Promise<IdeasFeedResponse> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.IdeaWhereInput = {
      authorId,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.stage !== undefined ? { stage: query.stage } : {}),
    };

    const [total, ideas] = await this.prisma.$transaction([
      this.prisma.idea.count({ where }),
      this.prisma.idea.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: IDEA_FORM_INCLUDE,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: ideas.map(toIdeaFormResponse),
      meta: { total, page, limit, totalPages },
    };
  }

  async findByIdSmart(id: string, userId: string): Promise<IdeaFormResponse> {
    const idea = await this.prisma.idea.findUnique({
      where: { id },
      include: IDEA_FORM_INCLUDE,
    });

    if (!idea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    if (idea.authorId !== userId && idea.status !== IdeaStatus.PUBLISHED) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    return toIdeaFormResponse(idea);
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

      if (existing.status !== IdeaStatus.DRAFT) {
        throw new BadRequestException('Only draft ideas can be updated');
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

    return toIdeaFormResponse(idea);
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

      const nextTitle =
        typeof dto.title === 'string' ? dto.title : existing.title;
      const nextDescription =
        typeof dto.description === 'string'
          ? dto.description
          : existing.description;
      const nextStage = dto.stage !== undefined ? dto.stage : existing.stage;
      const nextProblemsCount = Array.isArray(dto.problemIds)
        ? dto.problemIds.length
        : existing.problems.length;

      const errors: PublishValidationError[] = [];

      if (!nextTitle || nextTitle.trim().length < IDEA_TITLE_MIN_LENGTH) {
        errors.push({
          field: 'title',
          message: `Title is required and must be at least ${IDEA_TITLE_MIN_LENGTH} characters`,
        });
      }

      if (
        !nextDescription ||
        nextDescription.trim().length < IDEA_DESCRIPTION_MIN_LENGTH
      ) {
        errors.push({
          field: 'description',
          message: `Description is required and must be at least ${IDEA_DESCRIPTION_MIN_LENGTH} characters`,
        });
      }

      if (nextStage === null) {
        errors.push({
          field: 'stage',
          message: 'Stage is required',
        });
      }

      if (nextProblemsCount === 0) {
        errors.push({
          field: 'problems',
          message: 'At least one linked problem is required',
        });
      }

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

    return toIdeaFormResponse(updated);
  }

  async uploadMainImage(
    id: string,
    authorId: string,
    file: Express.Multer.File,
  ): Promise<IdeaFormResponse> {
    const idea = await this.prisma.idea.findFirst({
      where: { id, authorId },
      select: { id: true, status: true },
    });

    if (!idea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    if (!ALLOWED_UPLOAD_STATUSES.includes(idea.status)) {
      throw new BadRequestException(
        'Image upload is only allowed for draft or published ideas',
      );
    }

    const uploaded = await this.cloudinary.uploadIdeaMainImage(file, id);
    let publicIdsToDelete: string[] = [];

    try {
      await this.prisma.$transaction(async tx => {
        const existingMedia = await tx.ideaMedia.findMany({
          where: { ideaId: id, kind: MediaKind.MAIN_IMAGE },
          select: { publicId: true },
        });

        publicIdsToDelete = existingMedia.map(m => m.publicId);

        if (publicIdsToDelete.length > 0) {
          await tx.ideaMedia.deleteMany({
            where: { ideaId: id, kind: MediaKind.MAIN_IMAGE },
          });
        }

        await tx.ideaMedia.create({
          data: {
            ideaId: id,
            kind: MediaKind.MAIN_IMAGE,
            provider: MediaProvider.CLOUDINARY,
            url: uploaded.url,
            publicId: uploaded.publicId,
            mimeType: file.mimetype,
            byteSize: file.size,
            originalFilename: file.originalname || 'image',
            sortOrder: 0,
          },
        });
      });

      if (publicIdsToDelete.length > 0) {
        Promise.allSettled(
          publicIdsToDelete.map(publicId =>
            this.cloudinary.deleteByPublicId(publicId),
          ),
        ).catch(() => {});
      }
    } catch (err) {
      await this.cloudinary.deleteByPublicId(uploaded.publicId).catch(() => {});
      throw err;
    }

    return this.findByIdSmart(id, authorId);
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

      if (existing.status === IdeaStatus.DRAFT) {
        const currentLinks = await tx.ideaProblem.findMany({
          where: { ideaId: id },
          select: { problemId: true },
        });
        const problemIdsToCleanup = currentLinks.map(l => l.problemId);

        const media = await tx.ideaMedia.findMany({
          where: { ideaId: id },
          select: { publicId: true },
        });
        publicIdsToDelete = media.map(m => m.publicId);

        await tx.ideaProblem.deleteMany({ where: { ideaId: id } });
        await tx.idea.delete({ where: { id } });

        await this.cleanupOrphanedDraftProblems(
          tx,
          authorId,
          problemIdsToCleanup,
        );
      } else if (existing.status === IdeaStatus.PUBLISHED) {
        await tx.idea.update({
          where: { id },
          data: { status: IdeaStatus.ARCHIVED },
        });
      } else {
        throw new BadRequestException(
          `Cannot delete idea with status: ${existing.status as string}`,
        );
      }
    });

    if (publicIdsToDelete.length > 0) {
      Promise.allSettled(
        publicIdsToDelete.map(publicId =>
          this.cloudinary.deleteByPublicId(publicId),
        ),
      ).catch(() => {});
    }
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

    return toIdeaFormResponse(published);
  }
  async findSimilar(id: string): Promise<IdeaFormResponse[]> {
    const currentIdea = await this.prisma.idea.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!currentIdea) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }

    if (!currentIdea.title || currentIdea.title.trim().length === 0) {
      return [];
    }

    const searchQuery = convertToSearchQuery(currentIdea.title);
    if (!searchQuery) {
      return [];
    }

    const scoredRecords = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT i.id
      FROM "Idea" i
      WHERE 
        i.status = 'PUBLISHED' 
        AND i.id != ${id}
        AND to_tsvector('english', coalesce(i.title, '') || ' ' || coalesce(i.description, '')) @@ to_tsquery('english', ${searchQuery})
      ORDER BY ts_rank(
        setweight(to_tsvector('english', coalesce(i.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(i.description, '')), 'B'),
        to_tsquery('english', ${searchQuery})
      ) DESC, i."publishedAt" DESC
      LIMIT 3;
    `;

    if (scoredRecords.length === 0) {
      return [];
    }

    const similarIds = scoredRecords.map(record => record.id);

    const fullIdeas = await this.prisma.idea.findMany({
      where: {
        id: { in: similarIds },
      },
      include: IDEA_FORM_INCLUDE,
    });

    return similarIds
      .map(sampleId => fullIdeas.find(idea => idea.id === sampleId))
      .filter((idea): idea is NonNullable<typeof idea> => !!idea)
      .map(toIdeaFormResponse);
  }
}
