import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import {
  MediaKind,
  MediaProvider,
  Prisma,
  ProblemStatus,
} from '../../generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { toPgVectorLiteral } from '../embedding/vector.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  deleteAllProblemMedia,
  findProblemMediaPublicIds,
} from '../prisma/problem-media.queries';
import {
  createProblemTagLinks,
  deleteAllProblemTags,
  deleteProblemTagsExcept,
  findProblemTagIds,
} from '../prisma/problem-tag.queries';
import { CreateProblemDto } from './dto/create-problem.dto';
import { GetProblemsQueryDto } from './dto/get-problems-query.dto';
import { MyProblemsQueryDto } from './dto/my-problems.dto';
import { UpdateProblemDraftDto } from './dto/update-problem-draft.dto';
import {
  PROBLEM_FORM_INCLUDE,
  resolveProblemFormInclude,
} from './problem.constants';
import {
  type ProblemFormRecord,
  toProblemFormResponse,
} from './problem.mapper';
import type {
  ProblemFormResponse,
  ProblemsFeedResponse,
} from './types/problem-form.types';

export const PROBLEM_TITLE_MIN_LENGTH = 3;
export const PROBLEM_DESCRIPTION_MIN_LENGTH = 8;
export const MAX_PROBLEM_DRAFTS_PER_USER = 20;

type PublishValidationError = {
  field: string;
  message: string;
};

type ProblemTagPayload = {
  tagIds?: string[];
  tagLabels?: string[];
};

const PROBLEM_NOT_FOUND = 'Problem not found';

const ALLOWED_UPLOAD_STATUSES: ProblemStatus[] = [
  ProblemStatus.DRAFT,
  ProblemStatus.PUBLISHED,
];

@Injectable()
export class ProblemService {
  private readonly logger = new Logger(ProblemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  private async updateProblemEmbedding(
    id: string,
    title: string,
    description: string,
  ): Promise<void> {
    const text = `${title}\n${description}`.trim();
    if (!text) {
      return;
    }

    const vector = await this.embeddingService.embedText(text);
    const vectorLiteral = toPgVectorLiteral(vector);

    await this.prisma.$executeRaw`
      UPDATE problem SET ai_embedding = ${vectorLiteral}::vector WHERE id = ${id}
    `;
  }

  private enqueueProblemEmbeddingUpdate(
    id: string,
    title: string,
    description: string,
  ): void {
    void this.updateProblemEmbedding(id, title, description).catch(error =>
      this.logger.error(
        `Failed to update embedding for problem ${id}`,
        error as Error,
      ),
    );
  }

  async toggleLike(problemId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.problem.findFirst({
        where: { id: problemId },
        select: { id: true, status: true, authorId: true },
      });

      if (!existing) {
        throw new NotFoundException(PROBLEM_NOT_FOUND);
      }

      if (
        existing.authorId !== userId &&
        existing.status !== ProblemStatus.PUBLISHED
      ) {
        throw new NotFoundException(PROBLEM_NOT_FOUND);
      }

      const like = await tx.problemLike.findUnique({
        where: { problemId_userId: { problemId, userId } },
        select: { problemId: true, userId: true },
      });

      if (like) {
        await tx.problemLike.delete({
          where: { problemId_userId: { problemId, userId } },
          select: { problemId: true, userId: true },
        });

        await tx.problem.update({
          where: { id: problemId },
          data: { likeCount: { decrement: 1 } },
          select: { id: true },
        });

        return;
      }

      await tx.problemLike.create({
        data: { problemId, userId },
        select: { problemId: true, userId: true },
      });

      await tx.problem.update({
        where: { id: problemId },
        data: { likeCount: { increment: 1 } },
        select: { id: true },
      });
    });
  }

  private enqueueCloudinaryDeletes(publicIds: string[]): void {
    if (publicIds.length === 0) {
      return;
    }

    void Promise.allSettled(
      publicIds.map(publicId => this.cloudinary.deleteByPublicId(publicId)),
    ).then(results => {
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        this.logger.warn(
          `Cloudinary cleanup failed for ${failedCount}/${publicIds.length} asset(s) after problem deletion`,
        );
      }
    });
  }

  private parseCostBenefit(
    value: string | undefined,
  ): Prisma.Decimal | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value.trim().replace(/[$,\s]/g, '');
    if (!normalized) {
      return null;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      throw new BadRequestException(
        'costBenefit must be a valid monetary amount',
      );
    }

    return new Prisma.Decimal(normalized);
  }

  private collectPublishValidationErrors(problem: {
    title: string;
    description: string;
    stage: string | null;
  }): PublishValidationError[] {
    const errors: PublishValidationError[] = [];

    if (problem.title.length < PROBLEM_TITLE_MIN_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title is required and must be at least ${PROBLEM_TITLE_MIN_LENGTH} characters`,
      });
    }

    if (problem.description.length < PROBLEM_DESCRIPTION_MIN_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description is required and must be at least ${PROBLEM_DESCRIPTION_MIN_LENGTH} characters`,
      });
    }

    if (problem.stage === null) {
      errors.push({
        field: 'stage',
        message: 'Stage is required',
      });
    }

    return errors;
  }

  private async resolveTagIdsByLabels(
    tx: Prisma.TransactionClient,
    dto: ProblemTagPayload,
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

  private async applyProblemUpdates(
    tx: Prisma.TransactionClient,
    id: string,
    authorId: string,
    dto: UpdateProblemDraftDto,
  ): Promise<{ title: string; description: string } | null> {
    const existing = await tx.problem.findUnique({
      where: { id },
      select: { title: true, description: true },
    });

    const scalarData: {
      stage?: UpdateProblemDraftDto['stage'];
      title?: string;
      description?: string;
      valueProposition?: string | null;
      costBenefit?: Prisma.Decimal | null;
      category?: string | null;
      impact?: string | null;
    } = {};

    if ('stage' in dto && dto.stage !== undefined) {
      scalarData.stage = dto.stage;
    }
    if (dto.title !== undefined) {
      scalarData.title = dto.title;
    }
    if (dto.description !== undefined) {
      scalarData.description = dto.description;
    }
    if (dto.valueProposition !== undefined) {
      scalarData.valueProposition = dto.valueProposition || null;
    }
    if ('costBenefit' in dto) {
      scalarData.costBenefit = this.parseCostBenefit(dto.costBenefit);
    }
    if (dto.category !== undefined) {
      scalarData.category = dto.category || null;
    }
    if (dto.impact !== undefined) {
      scalarData.impact = dto.impact || null;
    }

    if (Object.keys(scalarData).length > 0) {
      await tx.problem.update({
        where: { id },
        data: scalarData,
      });
    }

    const titleChanged =
      dto.title !== undefined &&
      existing !== null &&
      dto.title !== existing.title;
    const descriptionChanged =
      dto.description !== undefined &&
      existing !== null &&
      dto.description !== existing.description;

    let embeddingUpdate: { title: string; description: string } | null = null;

    if (titleChanged || descriptionChanged) {
      const current = await tx.problem.findUnique({
        where: { id },
        select: { title: true, description: true },
      });

      if (current) {
        embeddingUpdate = {
          title: current.title,
          description: current.description,
        };
      }
    }

    if (dto.ideaIds !== undefined) {
      const currentLinks = await tx.ideaProblem.findMany({
        where: { problemId: id },
        select: { ideaId: true },
      });
      const previousIdeaIds = currentLinks.map(l => l.ideaId);

      const idsToRemove = previousIdeaIds.filter(
        iid => !dto.ideaIds!.includes(iid),
      );
      const idsToAdd = dto.ideaIds.filter(
        iid => !previousIdeaIds.includes(iid),
      );

      if (idsToRemove.length > 0) {
        await tx.ideaProblem.deleteMany({
          where: {
            problemId: id,
            ideaId: { in: idsToRemove },
          },
        });
      }

      if (idsToAdd.length > 0) {
        const ideas = await tx.idea.findMany({
          where: { id: { in: idsToAdd }, authorId },
          select: { id: true },
        });

        if (ideas.length !== idsToAdd.length) {
          throw new BadRequestException(
            'One or more idea IDs are invalid or not owned by you',
          );
        }

        await tx.ideaProblem.createMany({
          data: idsToAdd.map(ideaId => ({
            ideaId,
            problemId: id,
          })),
        });
      }
    }

    if (dto.tagIds !== undefined || 'tagLabels' in dto) {
      const incomingTagIds =
        dto.tagIds ?? (await this.resolveTagIdsByLabels(tx, dto));

      const previousTagIds = await findProblemTagIds(tx, id);

      const tagsToRemove = previousTagIds.filter(
        tagId => !incomingTagIds.includes(tagId),
      );
      const tagsToAdd = incomingTagIds.filter(
        tagId => !previousTagIds.includes(tagId),
      );

      await deleteProblemTagsExcept(tx, id, tagsToRemove);

      if (tagsToAdd.length > 0) {
        const tags = await tx.tag.findMany({
          where: { id: { in: tagsToAdd } },
          select: { id: true },
        });

        if (tags.length !== tagsToAdd.length) {
          throw new BadRequestException('One or more tag IDs are invalid');
        }

        await createProblemTagLinks(tx, id, tagsToAdd);
      }
    }

    return embeddingUpdate;
  }

  async create(
    authorId: string,
    dto: CreateProblemDto,
  ): Promise<ProblemFormResponse> {
    const { isPublished, ...updateDto } = dto;

    if (!isPublished) {
      const currentDraftsCount = await this.prisma.problem.count({
        where: { authorId, status: ProblemStatus.DRAFT },
      });

      if (currentDraftsCount >= MAX_PROBLEM_DRAFTS_PER_USER) {
        throw new BadRequestException(
          `Maximum limit of ${MAX_PROBLEM_DRAFTS_PER_USER} drafts reached. Publish or delete existing drafts.`,
        );
      }
    }
    const problem = await this.prisma.$transaction(async tx => {
      const created = await tx.problem.create({
        data: {
          authorId,
          status: ProblemStatus.DRAFT,
          title: dto.title ?? '',
          description: dto.description ?? '',
          ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
          ...(dto.valueProposition !== undefined
            ? { valueProposition: dto.valueProposition || null }
            : {}),
          ...(dto.category !== undefined
            ? { category: dto.category || null }
            : {}),
          ...(dto.impact !== undefined ? { impact: dto.impact || null } : {}),
          ...('costBenefit' in dto
            ? { costBenefit: this.parseCostBenefit(dto.costBenefit) }
            : {}),
        },
        include: PROBLEM_FORM_INCLUDE,
      });

      await this.applyProblemUpdates(tx, created.id, authorId, updateDto);

      let results = await tx.problem.findUnique({
        where: { id: created.id },
        include: PROBLEM_FORM_INCLUDE,
      });

      if (!results) {
        throw new NotFoundException(PROBLEM_NOT_FOUND);
      }

      if (isPublished) {
        const errors = this.collectPublishValidationErrors(results);

        if (errors.length > 0) {
          throw new UnprocessableEntityException(results);
        }

        results = await tx.problem.update({
          where: { id: created.id },
          data: {
            status: ProblemStatus.PUBLISHED,
            publishedAt: new Date(),
          },
          include: PROBLEM_FORM_INCLUDE,
        });
      }
      return results;
    });

    this.enqueueProblemEmbeddingUpdate(
      problem.id,
      problem.title,
      problem.description,
    );

    return toProblemFormResponse(problem, authorId);
  }

  private resolvePublicOrderBy(
    sort: GetProblemsQueryDto['sort'],
  ): Prisma.ProblemOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { publishedAt: 'asc' };
      case 'most-ideas-linked':
        return { ideas: { _count: 'desc' } };
      case 'most-viewed':
      case 'most-popular':
      case 'newest':
      default:
        return { publishedAt: 'desc' };
    }
  }

  async findAllPublic(
    query: GetProblemsQueryDto,
    currentUserId?: string,
  ): Promise<ProblemsFeedResponse> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.ProblemWhereInput = {
      status: ProblemStatus.PUBLISHED,
      ...(query.stage !== undefined ? { stage: query.stage } : {}),
    };

    const orderBy = this.resolvePublicOrderBy(query.sort);

    const [total, problems] = await this.prisma.$transaction([
      this.prisma.problem.count({ where }),
      this.prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: resolveProblemFormInclude(currentUserId),
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: problems.map(problem =>
        toProblemFormResponse(
          problem as unknown as ProblemFormRecord,
          currentUserId,
        ),
      ),
      meta: { total, page, limit, totalPages },
    };
  }

  async getDashboardFeed(userId: string, query: MyProblemsQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(query.limit ?? 10, 50));
    const skip = (page - 1) * limit;

    const basePublishedWhere: Prisma.ProblemWhereInput = {
      authorId: userId,
      status: ProblemStatus.PUBLISHED,
    };

    const baseDraftsWhere: Prisma.ProblemWhereInput = {
      authorId: userId,
      status: ProblemStatus.DRAFT,
    };

    const baseJoinedWhere: Prisma.ProblemWhereInput = {
      status: ProblemStatus.PUBLISHED,
      members: { some: { userId } },
    };

    const [publishedTotal, draftsTotal, joinedTotal, activeItems] =
      await this.prisma.$transaction([
        this.prisma.problem.count({ where: basePublishedWhere }),
        this.prisma.problem.count({ where: baseDraftsWhere }),
        this.prisma.problem.count({ where: baseJoinedWhere }),
        this.prisma.problem.findMany({
          where:
            query.tab === 'published'
              ? basePublishedWhere
              : query.tab === 'drafts'
                ? baseDraftsWhere
                : baseJoinedWhere,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: resolveProblemFormInclude(userId),
        }),
      ]);

    const activeTotal =
      query.tab === 'published'
        ? publishedTotal
        : query.tab === 'drafts'
          ? draftsTotal
          : joinedTotal;

    const totalPages = activeTotal === 0 ? 0 : Math.ceil(activeTotal / limit);

    return {
      data: activeItems.map(problem =>
        toProblemFormResponse(problem as unknown as ProblemFormRecord, userId),
      ),
      meta: {
        totals: {
          published: publishedTotal,
          drafts: draftsTotal,
          joined: joinedTotal,
        },
        page,
        limit,
        totalPages,
        hasNextPage: skip + limit < activeTotal,
      },
    };
  }

  async findByIdSmart(
    id: string,
    userId?: string,
  ): Promise<ProblemFormResponse> {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: resolveProblemFormInclude(userId),
    });

    if (!problem) {
      throw new NotFoundException(PROBLEM_NOT_FOUND);
    }

    if (
      (!userId || problem.authorId !== userId) &&
      problem.status !== ProblemStatus.PUBLISHED
    ) {
      throw new NotFoundException(PROBLEM_NOT_FOUND);
    }

    return toProblemFormResponse(
      problem as unknown as ProblemFormRecord,
      userId,
    );
  }

  async update(
    id: string,
    authorId: string,
    dto: UpdateProblemDraftDto,
  ): Promise<ProblemFormResponse> {
    const { problem, embeddingUpdate } = await this.prisma.$transaction(
      async tx => {
        const existing = await tx.problem.findFirst({
          where: { id, authorId },
          select: {
            id: true,
            status: true,
            title: true,
            description: true,
            stage: true,
          },
        });

        if (!existing) {
          throw new NotFoundException(PROBLEM_NOT_FOUND);
        }

        if (existing.status === ProblemStatus.ARCHIVED) {
          throw new BadRequestException('Archived problems cannot be updated');
        }

        const pendingEmbeddingUpdate = await this.applyProblemUpdates(
          tx,
          id,
          authorId,
          dto,
        );

        const updated = await tx.problem.findFirst({
          where: { id, authorId },
          include: PROBLEM_FORM_INCLUDE,
        });

        if (!updated) {
          throw new NotFoundException(PROBLEM_NOT_FOUND);
        }

        return {
          problem: updated,
          embeddingUpdate: pendingEmbeddingUpdate,
        };
      },
    );

    if (embeddingUpdate) {
      this.enqueueProblemEmbeddingUpdate(
        id,
        embeddingUpdate.title,
        embeddingUpdate.description,
      );
    }

    return toProblemFormResponse(problem, authorId);
  }

  async uploadAttachment(
    id: string,
    authorId: string,
    file: Express.Multer.File,
  ): Promise<ProblemFormResponse> {
    const problem = await this.prisma.problem.findFirst({
      where: { id, authorId },
      select: { id: true, status: true },
    });

    if (!problem) {
      throw new NotFoundException(PROBLEM_NOT_FOUND);
    }

    if (!ALLOWED_UPLOAD_STATUSES.includes(problem.status)) {
      throw new BadRequestException(
        'Attachment upload is only allowed for draft or published problems',
      );
    }

    const uploaded = await this.cloudinary.uploadProblemAttachment(file, id);

    try {
      const existingCount = await this.prisma.problemMedia.count({
        where: { problemId: id, kind: MediaKind.ATTACHMENT },
      });

      await this.prisma.problemMedia.create({
        data: {
          problemId: id,
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

  async deleteMedia(
    id: string,
    mediaId: string,
    authorId: string,
  ): Promise<void> {
    const problem = await this.prisma.problem.findFirst({
      where: { id, authorId },
      select: { id: true },
    });

    if (!problem) {
      throw new NotFoundException(PROBLEM_NOT_FOUND);
    }

    const media = await this.prisma.problemMedia.findFirst({
      where: { id: mediaId, problemId: id },
      select: { id: true, publicId: true },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    await this.prisma.problemMedia.delete({ where: { id: mediaId } });
    void this.cloudinary.deleteByPublicId(media.publicId);
  }

  async delete(id: string, authorId: string): Promise<void> {
    let publicIdsToDelete: string[] = [];

    await this.prisma.$transaction(async tx => {
      const existing = await tx.problem.findFirst({
        where: { id, authorId },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new NotFoundException(PROBLEM_NOT_FOUND);
      }

      if (existing.status === ProblemStatus.ARCHIVED) {
        throw new BadRequestException('Problem is already deleted');
      }

      publicIdsToDelete = await findProblemMediaPublicIds(tx, id);

      await deleteAllProblemMedia(tx, id);
      await deleteAllProblemTags(tx, id);
      await tx.ideaProblem.deleteMany({ where: { problemId: id } });
      await tx.problem.delete({ where: { id } });
    });

    this.enqueueCloudinaryDeletes(publicIdsToDelete);
  }
}
