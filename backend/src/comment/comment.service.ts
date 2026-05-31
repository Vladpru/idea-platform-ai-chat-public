import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  IdeaStatus,
  MediaProvider,
  Prisma,
  ProblemStatus,
} from '../../generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ALLOWED_COMMENT_ATTACHMENT_TYPES,
  COMMENT_CONTENT_MAX_LENGTH,
  COMMENT_FORBIDDEN,
  COMMENT_NOT_FOUND,
  IDEA_NOT_FOUND,
  MAX_COMMENT_ATTACHMENTS,
  PARENT_COMMENT_ENTITY_MISMATCH,
  PARENT_COMMENT_NOT_FOUND,
  PROBLEM_NOT_FOUND,
  commentDetailInclude,
  commentListInclude,
} from './comment.constants';
import { toCommentResponse } from './comment.mapper';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import type {
  CommentDto,
  PaginatedCommentsResponse,
} from './types/comment.types';

export enum CommentTargetEntity {
  IDEA = 'ideas',
  PROBLEM = 'problems',
}

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
    await this.assertEntityVisible(
      this.prisma,
      CommentTargetEntity.IDEA,
      ideaId,
      userId,
    );
    return this.findCommentsForEntity(
      CommentTargetEntity.IDEA,
      ideaId,
      query,
      userId,
    );
  }

  async findProblemComments(
    problemId: string,
    query: GetCommentsQueryDto,
    userId: string,
  ): Promise<PaginatedCommentsResponse> {
    await this.assertEntityVisible(
      this.prisma,
      CommentTargetEntity.PROBLEM,
      problemId,
      userId,
    );
    return this.findCommentsForEntity(
      CommentTargetEntity.PROBLEM,
      problemId,
      query,
      userId,
    );
  }

  async createIdeaComment(
    ideaId: string,
    dto: CreateCommentDto,
    userId: string,
    files: Express.Multer.File[] = [],
  ): Promise<CommentDto> {
    await this.assertEntityVisible(
      this.prisma,
      CommentTargetEntity.IDEA,
      ideaId,
      userId,
    );
    return this.createCommentForEntity(
      CommentTargetEntity.IDEA,
      ideaId,
      dto,
      userId,
      files,
    );
  }

  async createProblemComment(
    problemId: string,
    dto: CreateCommentDto,
    userId: string,
    files: Express.Multer.File[] = [],
  ): Promise<CommentDto> {
    await this.assertEntityVisible(
      this.prisma,
      CommentTargetEntity.PROBLEM,
      problemId,
      userId,
    );
    return this.createCommentForEntity(
      CommentTargetEntity.PROBLEM,
      problemId,
      dto,
      userId,
      files,
    );
  }

  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
    files: Express.Multer.File[] = [],
  ): Promise<CommentDto> {
    await this.assertCommentMutable(commentId, userId);

    const content = (dto.content ?? '').trim();
    const deletedAttachmentIds = dto.deletedAttachmentIds ?? [];
    const newFiles = files;

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
    const finalAttachmentCount =
      existingMedia.length - deletedAttachmentIds.length + newFiles.length;

    if (finalAttachmentCount > MAX_COMMENT_ATTACHMENTS) {
      throw new BadRequestException(
        `A maximum of ${MAX_COMMENT_ATTACHMENTS} attachments is allowed`,
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

    // 1. Upload new files FIRST
    const uploadedMediaData: Array<{
      url: string;
      publicId: string;
      mimeType: string;
      byteSize: number;
      originalFilename: string;
    }> = [];
    try {
      for (const file of newFiles) {
        const uploaded = await this.cloudinary.uploadCommentAttachment(
          file,
          commentId,
        );
        uploadedMediaData.push({
          url: uploaded.url,
          publicId: uploaded.publicId,
          mimeType: file.mimetype,
          byteSize: file.size,
          originalFilename: file.originalname || 'attachment',
        });
      }
    } catch (error) {
      await this.cleanupCloudinaryAssetsSafe(
        uploadedMediaData.map(m => m.publicId),
      );
      throw error;
    }

    // 2. Fast Database Transaction
    try {
      await this.prisma.$transaction(async tx => {
        if (deletedAttachmentIds.length > 0) {
          await tx.commentMedia.deleteMany({
            where: { commentId, id: { in: deletedAttachmentIds } },
          });
        }

        if (uploadedMediaData.length > 0) {
          await tx.commentMedia.createMany({
            data: uploadedMediaData.map(media => ({
              commentId,
              provider: MediaProvider.CLOUDINARY,
              ...media,
            })),
          });
        }

        await tx.comment.update({
          where: { id: commentId },
          data: { content },
          select: { id: true },
        });
      });
    } catch (error) {
      await this.cleanupCloudinaryAssetsSafe(
        uploadedMediaData.map(m => m.publicId),
      );
      throw error;
    }

    // 3. Cleanup old files
    if (publicIdsToDelete.length > 0) {
      this.cleanupCloudinaryAssetsSafe(publicIdsToDelete).catch(err => {
        this.logger.error(
          'Failed to cleanup deleted attachments in Cloudinary',
          err,
        );
      });
    }

    const updated = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: commentDetailInclude(userId),
    });

    if (!updated) {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }

    return toCommentResponse(updated);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    await this.assertCommentMutable(commentId, userId);

    const media = await this.prisma.commentMedia.findMany({
      where: { commentId },
      select: { publicId: true },
    });

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    if (media.length > 0) {
      this.cleanupCloudinaryAssetsSafe(media.map(item => item.publicId)).catch(
        err => {
          this.logger.error(
            'Failed to cleanup attachments for deleted comment',
            err,
          );
        },
      );
    }
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { id: true, ideaId: true, problemId: true },
      });

      if (!comment) {
        throw new NotFoundException(COMMENT_NOT_FOUND);
      }

      if (comment.ideaId) {
        await this.assertEntityVisible(
          tx,
          CommentTargetEntity.IDEA,
          comment.ideaId,
          userId,
        );
      } else if (comment.problemId) {
        await this.assertEntityVisible(
          tx,
          CommentTargetEntity.PROBLEM,
          comment.problemId,
          userId,
        );
      } else {
        throw new NotFoundException(COMMENT_NOT_FOUND);
      }

      const like = await tx.commentLike.findUnique({
        where: { commentId_userId: { commentId, userId } },
        select: { commentId: true },
      });

      if (like) {
        await tx.commentLike.delete({
          where: { commentId_userId: { commentId, userId } },
        });
      } else {
        await tx.commentLike.create({
          data: { commentId, userId },
        });
      }
    });
  }

  private async findCommentsForEntity(
    entityType: CommentTargetEntity,
    entityId: string,
    query: GetCommentsQueryDto,
    userId: string,
  ): Promise<PaginatedCommentsResponse> {
    // Defense-in-depth: жорсткі ліміти незалежно від DTO
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(query.limit ?? 20, 50));
    const skip = (page - 1) * limit;
    const createdAtOrder = query.sort === 'oldest' ? 'asc' : 'desc';

    const where: Prisma.CommentWhereInput =
      entityType === CommentTargetEntity.IDEA
        ? { ideaId: entityId }
        : { problemId: entityId };

    const [total, comments] = await this.prisma.$transaction([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: createdAtOrder },
        skip,
        take: limit,
        include: commentListInclude(userId),
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: comments.map(toCommentResponse),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    };
  }

  private async createCommentForEntity(
    entityType: CommentTargetEntity,
    entityId: string,
    dto: CreateCommentDto,
    userId: string,
    files: Express.Multer.File[],
  ): Promise<CommentDto> {
    const content = (dto.content ?? '').trim();

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
        `A maximum of ${MAX_COMMENT_ATTACHMENTS} attachments is allowed`,
      );
    }

    for (const file of files) {
      this.assertAllowedAttachmentMimeType(file);
    }

    const newCommentId = randomUUID();

    // 1. Upload files FIRST
    const uploadedMediaData: Array<{
      url: string;
      publicId: string;
      mimeType: string;
      byteSize: number;
      originalFilename: string;
    }> = [];
    try {
      for (const file of files) {
        const uploaded = await this.cloudinary.uploadCommentAttachment(
          file,
          newCommentId,
        );
        uploadedMediaData.push({
          url: uploaded.url,
          publicId: uploaded.publicId,
          mimeType: file.mimetype,
          byteSize: file.size,
          originalFilename: file.originalname || 'attachment',
        });
      }
    } catch (error) {
      await this.cleanupCloudinaryAssetsSafe(
        uploadedMediaData.map(m => m.publicId),
      );
      throw error;
    }

    // 2. Fast Database Transaction
    try {
      await this.prisma.$transaction(async tx => {
        if (dto.parentId) {
          await this.validateParentComment(
            tx,
            dto.parentId,
            entityType,
            entityId,
          );
        }

        await tx.comment.create({
          data: {
            id: newCommentId,
            content,
            authorId: userId,
            ideaId: entityType === CommentTargetEntity.IDEA ? entityId : null,
            problemId:
              entityType === CommentTargetEntity.PROBLEM ? entityId : null,
            parentId: dto.parentId ?? null,
            media: {
              createMany: {
                data: uploadedMediaData.map(media => ({
                  provider: MediaProvider.CLOUDINARY,
                  ...media,
                })),
              },
            },
          },
        });
      });
    } catch (error) {
      await this.cleanupCloudinaryAssetsSafe(
        uploadedMediaData.map(m => m.publicId),
      );
      throw error;
    }

    const fullComment = await this.prisma.comment.findUnique({
      where: { id: newCommentId },
      include: commentDetailInclude(userId),
    });

    if (!fullComment) {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }

    return toCommentResponse(fullComment);
  }

  private assertAllowedAttachmentMimeType(file: Express.Multer.File): void {
    if (!ALLOWED_COMMENT_ATTACHMENT_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported attachment type: ${file.mimetype}`,
      );
    }
  }

  private async cleanupCloudinaryAssetsSafe(
    publicIds: string[],
  ): Promise<void> {
    if (publicIds.length === 0) return;

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

  private async assertCommentMutable(
    commentId: string,
    userId: string,
  ): Promise<{
    id: string;
    authorId: string;
    ideaId: string | null;
    problemId: string | null;
  }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, ideaId: true, problemId: true },
    });

    if (!comment) {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(COMMENT_FORBIDDEN);
    }

    if (comment.ideaId) {
      await this.assertEntityVisible(
        this.prisma,
        CommentTargetEntity.IDEA,
        comment.ideaId,
        userId,
      );
    } else if (comment.problemId) {
      await this.assertEntityVisible(
        this.prisma,
        CommentTargetEntity.PROBLEM,
        comment.problemId,
        userId,
      );
    } else {
      throw new NotFoundException(COMMENT_NOT_FOUND);
    }

    return comment;
  }

  private async validateParentComment(
    tx: Prisma.TransactionClient,
    parentId: string,
    entityType: CommentTargetEntity,
    entityId: string,
  ): Promise<void> {
    const parent = await tx.comment.findUnique({
      where: { id: parentId },
      select: { id: true, ideaId: true, problemId: true },
    });

    if (!parent) {
      throw new BadRequestException(PARENT_COMMENT_NOT_FOUND);
    }

    if (entityType === CommentTargetEntity.IDEA && parent.ideaId !== entityId) {
      throw new BadRequestException(PARENT_COMMENT_ENTITY_MISMATCH);
    }

    if (
      entityType === CommentTargetEntity.PROBLEM &&
      parent.problemId !== entityId
    ) {
      throw new BadRequestException(PARENT_COMMENT_ENTITY_MISMATCH);
    }
  }

  private async assertEntityVisible(
    client: Prisma.TransactionClient | PrismaService,
    entityType: CommentTargetEntity,
    entityId: string,
    userId: string,
  ): Promise<void> {
    if (entityType === CommentTargetEntity.IDEA) {
      const idea = await client.idea.findUnique({
        where: { id: entityId },
        select: { status: true, authorId: true },
      });
      if (
        !idea ||
        (idea.authorId !== userId && idea.status !== IdeaStatus.PUBLISHED)
      ) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }
    } else {
      const problem = await client.problem.findUnique({
        where: { id: entityId },
        select: { status: true, authorId: true },
      });
      if (
        !problem ||
        (problem.authorId !== userId &&
          problem.status !== ProblemStatus.PUBLISHED)
      ) {
        throw new NotFoundException(PROBLEM_NOT_FOUND);
      }
    }
  }
}
