import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';

import {
  IdeaStatus,
  MediaProvider,
  Prisma,
  ProblemStatus,
} from '../../generated/prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NOTIFICATION_EVENTS } from '../notification/events/notification-event-names';
import type { CommentCreatedNotificationEvent } from '../notification/events/notification.events';
import { resolveActorDisplayName } from '../notification/lib/notification-integration.util';
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
  PARENT_QUOTE_CONTENT_MAX_LENGTH,
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findIdeaComments(
    ideaId: string,
    query: GetCommentsQueryDto,
    userId: string,
  ): Promise<PaginatedCommentsResponse> {
    await this.getVisibleEntity(CommentTargetEntity.IDEA, ideaId, userId);
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
    await this.getVisibleEntity(CommentTargetEntity.PROBLEM, problemId, userId);
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
    const entity = await this.getVisibleEntity(
      CommentTargetEntity.IDEA,
      ideaId,
      userId,
    );
    return this.createCommentForEntity(
      CommentTargetEntity.IDEA,
      ideaId,
      entity,
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
    const entity = await this.getVisibleEntity(
      CommentTargetEntity.PROBLEM,
      problemId,
      userId,
    );
    return this.createCommentForEntity(
      CommentTargetEntity.PROBLEM,
      problemId,
      entity,
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
    const content = (dto.content ?? '').trim();
    const deletedAttachmentIds = dto.deletedAttachmentIds ?? [];

    this.assertContentLimits(content);

    let uploadedMediaData: Array<{
      url: string;
      publicId: string;
      mimeType: string;
      byteSize: number;
      originalFilename: string;
    }> = [];
    const publicIdsToDelete: string[] = [];

    try {
      if (files.length > 0) {
        for (const file of files) {
          this.assertAllowedAttachmentMimeType(file);
        }

        uploadedMediaData = await Promise.all(
          files.map(async file => {
            const uploaded = await this.cloudinary.uploadCommentAttachment(
              file,
              commentId,
            );
            return {
              url: uploaded.url,
              publicId: uploaded.publicId,
              mimeType: file.mimetype,
              byteSize: file.size,
              originalFilename: file.originalname || 'attachment',
            };
          }),
        );
      }

      const updatedComment = await this.prisma.$transaction(async tx => {
        await this.assertCommentMutable(tx, commentId, userId);

        const existingMedia = await tx.commentMedia.findMany({
          where: { commentId },
          select: { id: true, publicId: true },
        });

        const existingMediaIds = new Set(existingMedia.map(m => m.id));
        for (const attachmentId of deletedAttachmentIds) {
          if (!existingMediaIds.has(attachmentId)) {
            throw new BadRequestException('Invalid attachment id');
          }
        }

        const finalAttachmentCount =
          existingMedia.length - deletedAttachmentIds.length + files.length;
        this.assertAttachmentLimits(finalAttachmentCount);
        this.assertCommentNotEmpty(content, finalAttachmentCount);

        const deletedIdSet = new Set(deletedAttachmentIds);
        existingMedia
          .filter(media => deletedIdSet.has(media.id))
          .forEach(media => publicIdsToDelete.push(media.publicId));

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

        return tx.comment.update({
          where: { id: commentId },
          data: { content },
          include: commentDetailInclude(userId),
        });
      });

      if (publicIdsToDelete.length > 0) {
        void this.cleanupCloudinaryAssetsGraceful(publicIdsToDelete);
      }

      return toCommentResponse(updatedComment);
    } catch (error) {
      await this.cleanupCloudinaryAssetsGraceful(
        uploadedMediaData.map(m => m.publicId),
      );
      throw error;
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const publicIdsToDelete: string[] = [];

    await this.prisma.$transaction(async tx => {
      await this.assertCommentMutable(tx, commentId, userId);

      const childComments = await tx.comment.findMany({
        where: { parentId: commentId },
        select: { id: true },
      });

      const allCommentIdsToDelete = [
        commentId,
        ...childComments.map(c => c.id),
      ];

      const media = await tx.commentMedia.findMany({
        where: { commentId: { in: allCommentIdsToDelete } },
        select: { publicId: true },
      });

      media.forEach(item => publicIdsToDelete.push(item.publicId));

      await tx.comment.delete({
        where: { id: commentId },
      });
    });

    if (publicIdsToDelete.length > 0) {
      void this.cleanupCloudinaryAssetsGraceful(publicIdsToDelete);
    }
  }

  async toggleCommentLike(commentId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async tx => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          ideaId: true,
          problemId: true,
          idea: { select: { status: true, authorId: true } },
          problem: { select: { status: true, authorId: true } },
        },
      });

      if (!comment) {
        throw new NotFoundException(COMMENT_NOT_FOUND);
      }

      if (comment.ideaId && comment.idea) {
        if (
          comment.idea.authorId !== userId &&
          comment.idea.status !== IdeaStatus.PUBLISHED
        ) {
          throw new NotFoundException(IDEA_NOT_FOUND);
        }
      } else if (comment.problemId && comment.problem) {
        if (
          comment.problem.authorId !== userId &&
          comment.problem.status !== ProblemStatus.PUBLISHED
        ) {
          throw new NotFoundException(PROBLEM_NOT_FOUND);
        }
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
    entityMeta: { authorId: string; title: string | null },
    dto: CreateCommentDto,
    userId: string,
    files: Express.Multer.File[],
  ): Promise<CommentDto> {
    const content = (dto.content ?? '').trim();

    this.assertCommentNotEmpty(content, files.length);
    this.assertContentLimits(content);
    this.assertAttachmentLimits(files.length);

    for (const file of files) {
      this.assertAllowedAttachmentMimeType(file);
    }

    const newCommentId = randomUUID();
    let uploadedMediaData: Array<{
      url: string;
      publicId: string;
      mimeType: string;
      byteSize: number;
      originalFilename: string;
    }> = [];

    try {
      if (files.length > 0) {
        uploadedMediaData = await Promise.all(
          files.map(async file => {
            const uploaded = await this.cloudinary.uploadCommentAttachment(
              file,
              newCommentId,
            );
            return {
              url: uploaded.url,
              publicId: uploaded.publicId,
              mimeType: file.mimetype,
              byteSize: file.size,
              originalFilename: file.originalname || 'attachment',
            };
          }),
        );
      }

      const fullComment = await this.prisma.$transaction(async tx => {
        if (dto.parentId) {
          await this.validateParentComment(
            tx,
            dto.parentId,
            entityType,
            entityId,
          );
        }

        return tx.comment.create({
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
          include: commentDetailInclude(userId),
        });
      });

      await this.emitCommentCreatedNotification({
        commentId: fullComment.id,
        entityType,
        entityId,
        actorId: userId,
        content,
        entityAuthorId: entityMeta.authorId,
        entityTitle: entityMeta.title,
      });

      return toCommentResponse(fullComment);
    } catch (error) {
      await this.cleanupCloudinaryAssetsGraceful(
        uploadedMediaData.map(m => m.publicId),
      );
      throw error;
    }
  }

  private truncateContentSnippet(content: string): string {
    if (content.length <= PARENT_QUOTE_CONTENT_MAX_LENGTH) return content;
    return `${content.slice(0, PARENT_QUOTE_CONTENT_MAX_LENGTH).trimEnd()}…`;
  }

  private async emitCommentCreatedNotification(params: {
    commentId: string;
    entityType: CommentTargetEntity;
    entityId: string;
    actorId: string;
    content: string;
    entityAuthorId: string;
    entityTitle: string | null;
  }): Promise<void> {
    if (params.entityAuthorId === params.actorId) return;

    const actorName = await resolveActorDisplayName(
      this.prisma,
      params.actorId,
    );

    const event: CommentCreatedNotificationEvent = {
      recipientUserId: params.entityAuthorId,
      commentId: params.commentId,
      entityType:
        params.entityType === CommentTargetEntity.IDEA ? 'idea' : 'problem',
      entityId: params.entityId,
      entityTitle: params.entityTitle ?? 'Untitled',
      actorId: params.actorId,
      actorName,
      contentSnippet: this.truncateContentSnippet(params.content),
    };

    this.eventEmitter.emit(NOTIFICATION_EVENTS.COMMENT_CREATED, event);
  }

  private assertCommentNotEmpty(
    content: string,
    attachmentCount: number,
  ): void {
    if (content.length === 0 && attachmentCount === 0) {
      throw new BadRequestException(
        'Comment must include text content or at least one attachment',
      );
    }
  }

  private assertContentLimits(content: string): void {
    if (content.length > COMMENT_CONTENT_MAX_LENGTH) {
      throw new BadRequestException(
        `Comment content must be at most ${COMMENT_CONTENT_MAX_LENGTH} characters`,
      );
    }
  }

  private assertAttachmentLimits(count: number): void {
    if (count > MAX_COMMENT_ATTACHMENTS) {
      throw new BadRequestException(
        `A maximum of ${MAX_COMMENT_ATTACHMENTS} attachments is allowed`,
      );
    }
  }

  private assertAllowedAttachmentMimeType(file: Express.Multer.File): void {
    if (!ALLOWED_COMMENT_ATTACHMENT_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported attachment type: ${file.mimetype}`,
      );
    }
  }

  private async cleanupCloudinaryAssetsGraceful(
    publicIds: string[],
  ): Promise<void> {
    if (publicIds.length === 0) return;

    try {
      const results = await Promise.allSettled(
        publicIds.map(publicId => this.cloudinary.deleteByPublicId(publicId)),
      );

      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        this.logger.warn(
          `Cloudinary cleanup failed for ${failedCount}/${publicIds.length} comment attachment(s)`,
        );
      }
    } catch (error) {
      this.logger.error('Unexpected error during Cloudinary cleanup', error);
    }
  }

  private async getVisibleEntity(
    entityType: CommentTargetEntity,
    entityId: string,
    userId: string,
  ): Promise<{ authorId: string; title: string | null }> {
    if (entityType === CommentTargetEntity.IDEA) {
      const idea = await this.prisma.idea.findUnique({
        where: { id: entityId },
        select: { status: true, authorId: true, title: true },
      });
      if (
        !idea ||
        (idea.authorId !== userId && idea.status !== IdeaStatus.PUBLISHED)
      ) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }
      return idea;
    } else {
      const problem = await this.prisma.problem.findUnique({
        where: { id: entityId },
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
  }

  private async assertCommentMutable(
    tx: Prisma.TransactionClient,
    commentId: string,
    userId: string,
  ): Promise<{ id: string }> {
    const comment = await tx.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        ideaId: true,
        problemId: true,
        idea: { select: { status: true, authorId: true } },
        problem: { select: { status: true, authorId: true } },
      },
    });

    if (!comment) throw new NotFoundException(COMMENT_NOT_FOUND);
    if (comment.authorId !== userId)
      throw new ForbiddenException(COMMENT_FORBIDDEN);

    if (comment.ideaId && comment.idea) {
      if (
        comment.idea.authorId !== userId &&
        comment.idea.status !== IdeaStatus.PUBLISHED
      ) {
        throw new NotFoundException(IDEA_NOT_FOUND);
      }
    } else if (comment.problemId && comment.problem) {
      if (
        comment.problem.authorId !== userId &&
        comment.problem.status !== ProblemStatus.PUBLISHED
      ) {
        throw new NotFoundException(PROBLEM_NOT_FOUND);
      }
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

    if (!parent) throw new BadRequestException(PARENT_COMMENT_NOT_FOUND);

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
}
