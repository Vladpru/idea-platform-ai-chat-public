import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  CommentEntityType,
  MediaProvider,
  Prisma,
} from '../../generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  COMMENT_ATTACHMENT_MIME_REGEX,
  COMMENT_FORBIDDEN,
  COMMENT_NOT_FOUND,
  COMMENT_CONTENT_MAX_LENGTH,
  IDEA_NOT_FOUND,
  MAX_COMMENT_ATTACHMENTS,
  PARENT_COMMENT_ENTITY_MISMATCH,
  PARENT_COMMENT_NOT_FOUND,
  PROBLEM_NOT_FOUND,
  commentDetailInclude,
  commentListInclude,
} from './comment.constants';
import { type CommentRecord, toCommentResponse } from './comment.mapper';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import type {
  CommentDto,
  PaginatedCommentsResponse,
} from './types/comment.types';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findIdeaComments(
    ideaId: string,
    query: GetCommentsQueryDto,
    userId: string,
  ): Promise<PaginatedCommentsResponse> {
    await this.assertIdeaVisible(ideaId, userId);
    return this.findCommentsForEntity({
      entityType: CommentEntityType.IDEA,
      ideaId,
      query,
      userId,
    });
  }

  async findProblemComments(
    problemId: string,
    query: GetCommentsQueryDto,
    userId: string,
  ): Promise<PaginatedCommentsResponse> {
    await this.assertProblemVisible(problemId, userId);
    return this.findCommentsForEntity({
      entityType: CommentEntityType.PROBLEM,
      problemId,
      query,
      userId,
    });
  }

  async createIdeaComment(
    ideaId: string,
    dto: CreateCommentDto,
    userId: string,
    files: Express.Multer.File[] = [],
  ): Promise<CommentDto> {
    await this.assertIdeaVisible(ideaId, userId);
    return this.createCommentForEntity({
      entityType: CommentEntityType.IDEA,
      ideaId,
      dto,
      userId,
      files,
    });
  }

  async createProblemComment(
    problemId: string,
    dto: CreateCommentDto,
    userId: string,
    files: Express.Multer.File[] = [],
  ): Promise<CommentDto> {
    await this.assertProblemVisible(problemId, userId);
    return this.createCommentForEntity({
      entityType: CommentEntityType.PROBLEM,
      problemId,
      dto,
      userId,
      files,
    });
  }

  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
    files: Express.Multer.File[] = [],
  ): Promise<CommentDto> {
    await this.findCommentForMutation(commentId, userId);

    const content = dto.content.trim();
    const deletedAttachmentIds = dto.deletedAttachmentIds ?? [];
    const newFiles = files ?? [];

    if (content.length > COMMENT_CONTENT_MAX_LENGTH) {
      throw new BadRequestException(
        `Comment content must be at most ${COMMENT_CONTENT_MAX_LENGTH} characters`,
      );
    }

    const existingMedia = await this.prisma.commentMedia.findMany({
      where: { commentId },
      select: { id: true, publicId: true },
    });

    const existingMediaIds = new Set(existingMedia.map(media => media.id));

    for (const attachmentId of deletedAttachmentIds) {
      if (!existingMediaIds.has(attachmentId)) {
        throw new BadRequestException('Invalid attachment id');
      }
    }

    const deletedIdSet = new Set(deletedAttachmentIds);
    const remainingCount =
      existingMedia.length - deletedAttachmentIds.length;
    const finalAttachmentCount = remainingCount + newFiles.length;

    if (finalAttachmentCount > MAX_COMMENT_ATTACHMENTS) {
      throw new BadRequestException(
        `A maximum of ${MAX_COMMENT_ATTACHMENTS} attachments is allowed per comment`,
      );
    }

    if (content.length === 0 && finalAttachmentCount === 0) {
      throw new BadRequestException(
        'Comment must include text content or at least one attachment',
      );
    }

    for (const file of newFiles) {
      this.assertAllowedAttachmentMimeType(file);
    }

    const publicIdsToDelete = existingMedia
      .filter(media => deletedIdSet.has(media.id))
      .map(media => media.publicId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (deletedAttachmentIds.length > 0) {
        await tx.commentMedia.deleteMany({
          where: {
            commentId,
            id: { in: deletedAttachmentIds },
          },
        });
      }

      await tx.comment.update({
        where: { id: commentId },
        data: { content },
        select: { id: true },
      });
    });

    void this.cleanupCloudinaryAssets(publicIdsToDelete);

    const uploadedPublicIds: string[] = [];

    try {
      for (const file of newFiles) {
        const uploaded = await this.cloudinary.uploadCommentAttachment(
          file,
          commentId,
        );
        uploadedPublicIds.push(uploaded.publicId);

        await this.prisma.commentMedia.create({
          data: {
            commentId,
            provider: MediaProvider.CLOUDINARY,
            url: uploaded.url,
            publicId: uploaded.publicId,
            mimeType: file.mimetype,
            byteSize: file.size,
            originalFilename: file.originalname || 'attachment',
          },
        });
      }
    } catch (error) {
      await this.cleanupCloudinaryAssets(uploadedPublicIds);
      throw error;
    }

    const updated = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: commentDetailInclude(userId),
    });

    if (!updated) {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }

    return toCommentResponse(updated as CommentRecord);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.findCommentForMutation(commentId, userId);

    const media = await this.prisma.commentMedia.findMany({
      where: { commentId },
      select: { publicId: true },
    });

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.comment.delete({
        where: { id: commentId },
        select: { id: true },
      });

      if (comment.entityType === CommentEntityType.IDEA && comment.ideaId) {
        await tx.idea.update({
          where: { id: comment.ideaId },
          data: { commentCount: { decrement: 1 } },
          select: { id: true },
        });
      } else if (
        comment.entityType === CommentEntityType.PROBLEM &&
        comment.problemId
      ) {
        await tx.problem.update({
          where: { id: comment.problemId },
          data: { commentCount: { decrement: 1 } },
          select: { id: true },
        });
      }
    });

    void this.cleanupCloudinaryAssets(media.map(item => item.publicId));
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          entityType: true,
          ideaId: true,
          problemId: true,
        },
      });

      if (!comment) {
        throw new NotFoundException(COMMENT_NOT_FOUND);
      }

      if (comment.entityType === CommentEntityType.IDEA && comment.ideaId) {
        await this.assertIdeaVisibleInTransaction(tx, comment.ideaId, userId);
      } else if (
        comment.entityType === CommentEntityType.PROBLEM &&
        comment.problemId
      ) {
        await this.assertProblemVisibleInTransaction(
          tx,
          comment.problemId,
          userId,
        );
      } else {
        throw new NotFoundException(COMMENT_NOT_FOUND);
      }

      const like = await tx.commentLike.findUnique({
        where: { commentId_userId: { commentId, userId } },
        select: { commentId: true, userId: true },
      });

      if (like) {
        await tx.commentLike.delete({
          where: { commentId_userId: { commentId, userId } },
          select: { commentId: true, userId: true },
        });

        await tx.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
          select: { id: true },
        });

        return;
      }

      await tx.commentLike.create({
        data: { commentId, userId },
        select: { commentId: true, userId: true },
      });

      await tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
        select: { id: true },
      });
    });
  }

  private async findCommentsForEntity(params: {
    entityType: CommentEntityType;
    ideaId?: string;
    problemId?: string;
    query: GetCommentsQueryDto;
    userId: string;
  }): Promise<PaginatedCommentsResponse> {
    const page = Math.max(1, params.query.page ?? 1);
    const limit = Math.max(1, Math.min(params.query.limit ?? 20, 50));
    const skip = (page - 1) * limit;
    const createdAtOrder =
      params.query.sort === 'oldest' ? ('asc' as const) : ('desc' as const);

    const where: Prisma.CommentWhereInput =
      params.entityType === CommentEntityType.IDEA
        ? { ideaId: params.ideaId }
        : { problemId: params.problemId };

    const [total, comments] = await this.prisma.$transaction([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: createdAtOrder },
        skip,
        take: limit,
        include: commentListInclude(params.userId),
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: comments.map(comment =>
        toCommentResponse(comment as CommentRecord),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    };
  }

  private async createCommentForEntity(params: {
    entityType: CommentEntityType;
    ideaId?: string;
    problemId?: string;
    dto: CreateCommentDto;
    userId: string;
    files: Express.Multer.File[];
  }): Promise<CommentDto> {
    const content = params.dto.content?.trim() ?? '';
    const files = params.files ?? [];

    if (content.length === 0 && files.length === 0) {
      throw new BadRequestException(
        'Comment must include text content or at least one attachment',
      );
    }

    if (content.length > COMMENT_CONTENT_MAX_LENGTH) {
      throw new BadRequestException(
        `Comment content must be at most ${COMMENT_CONTENT_MAX_LENGTH} characters`,
      );
    }

    if (files.length > MAX_COMMENT_ATTACHMENTS) {
      throw new BadRequestException(
        `A maximum of ${MAX_COMMENT_ATTACHMENTS} attachments is allowed per comment`,
      );
    }

    for (const file of files) {
      this.assertAllowedAttachmentMimeType(file);
    }

    const created = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        if (params.dto.parentId) {
          await this.validateParentComment(tx, {
            parentId: params.dto.parentId,
            entityType: params.entityType,
            ideaId: params.ideaId,
            problemId: params.problemId,
          });
        }

        const comment = await tx.comment.create({
          data: {
            content,
            authorId: params.userId,
            entityType: params.entityType,
            ideaId: params.ideaId ?? null,
            problemId: params.problemId ?? null,
            parentId: params.dto.parentId ?? null,
          },
          select: { id: true },
        });

        if (params.entityType === CommentEntityType.IDEA && params.ideaId) {
          await tx.idea.update({
            where: { id: params.ideaId },
            data: { commentCount: { increment: 1 } },
            select: { id: true },
          });
        } else if (
          params.entityType === CommentEntityType.PROBLEM &&
          params.problemId
        ) {
          await tx.problem.update({
            where: { id: params.problemId },
            data: { commentCount: { increment: 1 } },
            select: { id: true },
          });
        }

        return comment;
      },
    );

    const uploadedPublicIds: string[] = [];

    try {
      for (const file of files) {
        const uploaded = await this.cloudinary.uploadCommentAttachment(
          file,
          created.id,
        );
        uploadedPublicIds.push(uploaded.publicId);

        await this.prisma.commentMedia.create({
          data: {
            commentId: created.id,
            provider: MediaProvider.CLOUDINARY,
            url: uploaded.url,
            publicId: uploaded.publicId,
            mimeType: file.mimetype,
            byteSize: file.size,
            originalFilename: file.originalname || 'attachment',
          },
        });
      }
    } catch (error) {
      await this.cleanupCloudinaryAssets(uploadedPublicIds);
      throw error;
    }

    const fullComment = await this.prisma.comment.findUnique({
      where: { id: created.id },
      include: commentDetailInclude(params.userId),
    });

    if (!fullComment) {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }

    return toCommentResponse(fullComment as CommentRecord);
  }

  private assertAllowedAttachmentMimeType(file: Express.Multer.File): void {
    if (!COMMENT_ATTACHMENT_MIME_REGEX.test(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported attachment type: ${file.mimetype}`,
      );
    }
  }

  private async cleanupCloudinaryAssets(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      publicIds.map(publicId => this.cloudinary.deleteByPublicId(publicId)),
    );

    const failedCount = results.filter(r => r.status === 'rejected').length;
    if (failedCount > 0) {
      this.logger.warn(
        `Cloudinary cleanup failed for ${failedCount}/${publicIds.length} comment attachment(s)`,
      );
    }
  }

  private async findCommentForMutation(
    commentId: string,
    userId: string,
  ): Promise<{
    id: string;
    authorId: string;
    entityType: CommentEntityType;
    ideaId: string | null;
    problemId: string | null;
  }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        entityType: true,
        ideaId: true,
        problemId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(COMMENT_FORBIDDEN);
    }

    if (comment.entityType === CommentEntityType.IDEA && comment.ideaId) {
      await this.assertIdeaVisible(comment.ideaId, userId);
    } else if (
      comment.entityType === CommentEntityType.PROBLEM &&
      comment.problemId
    ) {
      await this.assertProblemVisible(comment.problemId, userId);
    } else {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }

    return comment;
  }

  private async validateParentComment(
    tx: Prisma.TransactionClient,
    params: {
      parentId: string;
      entityType: CommentEntityType;
      ideaId?: string;
      problemId?: string;
    },
  ): Promise<void> {
    const parent = await tx.comment.findUnique({
      where: { id: params.parentId },
      select: {
        id: true,
        entityType: true,
        ideaId: true,
        problemId: true,
      },
    });

    if (!parent) {
      throw new BadRequestException(PARENT_COMMENT_NOT_FOUND);
    }

    if (params.entityType === CommentEntityType.IDEA) {
      if (
        parent.entityType !== CommentEntityType.IDEA ||
        parent.ideaId !== params.ideaId
      ) {
        throw new BadRequestException(PARENT_COMMENT_ENTITY_MISMATCH);
      }
      return;
    }

    if (
      parent.entityType !== CommentEntityType.PROBLEM ||
      parent.problemId !== params.problemId
    ) {
      throw new BadRequestException(PARENT_COMMENT_ENTITY_MISMATCH);
    }
  }

  private async assertIdeaVisible(
    ideaId: string,
    userId: string,
  ): Promise<void> {
    const idea = await this.prisma.idea.findFirst({
      where: { id: ideaId },
      select: { id: true, status: true, authorId: true },
    });

    if (!idea || !this.isEntityVisible(idea, userId)) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }
  }

  private async assertProblemVisible(
    problemId: string,
    userId: string,
  ): Promise<void> {
    const problem = await this.prisma.problem.findFirst({
      where: { id: problemId },
      select: { id: true, status: true, authorId: true },
    });

    if (!problem || !this.isEntityVisible(problem, userId)) {
      throw new NotFoundException(PROBLEM_NOT_FOUND);
    }
  }

  private async assertIdeaVisibleInTransaction(
    tx: Prisma.TransactionClient,
    ideaId: string,
    userId: string,
  ): Promise<void> {
    const idea = await tx.idea.findFirst({
      where: { id: ideaId },
      select: { id: true, status: true, authorId: true },
    });

    if (!idea || !this.isEntityVisible(idea, userId)) {
      throw new NotFoundException(IDEA_NOT_FOUND);
    }
  }

  private async assertProblemVisibleInTransaction(
    tx: Prisma.TransactionClient,
    problemId: string,
    userId: string,
  ): Promise<void> {
    const problem = await tx.problem.findFirst({
      where: { id: problemId },
      select: { id: true, status: true, authorId: true },
    });

    if (!problem || !this.isEntityVisible(problem, userId)) {
      throw new NotFoundException(PROBLEM_NOT_FOUND);
    }
  }

  private isEntityVisible(
    entity: { authorId: string; status: string },
    userId: string,
  ): boolean {
    return entity.authorId === userId || entity.status === 'PUBLISHED';
  }
}
