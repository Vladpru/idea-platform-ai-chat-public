import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { memoryStorage } from 'multer';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import {
  ALLOWED_COMMENT_ATTACHMENT_TYPES,
  MAX_COMMENT_ATTACHMENTS,
} from './comment.constants';
import { CommentService } from './comment.service';
import { CreateCommentDto, GetCommentsQueryDto, UpdateCommentDto } from './dto';
import { CommentCreateThrottlerGuard } from './guards/comment-create-throttler.guard';
import type {
  CommentDto,
  PaginatedCommentsResponse,
} from './types/comment.types';

export enum CommentTargetEntity {
  IDEA = 'ideas',
  PROBLEM = 'problems',
}

type AuthenticatedRequest = Request & { user: { id: string } };

const COMMENT_FILES_INTERCEPTOR = FilesInterceptor(
  'files',
  MAX_COMMENT_ATTACHMENTS,
  {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      if (!ALLOWED_COMMENT_ATTACHMENT_TYPES.has(file.mimetype)) {
        return callback(new BadRequestException('Invalid file type'), false);
      }
      callback(null, true);
    },
  },
);

@ApiTags('comments')
@Controller('comments')
@JwtAuth()
@ApiBearerAuth()
export class CommentActionsController {
  constructor(private readonly commentService: CommentService) {}

  @Patch(':commentId')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a comment (author only)' })
  @ApiOkResponse({ description: 'Comment updated' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({ description: 'Not the comment author' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  @UseInterceptors(COMMENT_FILES_INTERCEPTOR)
  update(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<CommentDto> {
    return this.commentService.updateComment(
      commentId,
      req.user.id,
      dto,
      files ?? [],
    );
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment (author only)' })
  @ApiNoContentResponse({ description: 'Comment deleted' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiForbiddenResponse({ description: 'Not the comment author' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  delete(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.commentService.deleteComment(commentId, req.user.id);
  }

  @Post(':commentId/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on a comment' })
  @ApiOkResponse({ description: 'Like toggled' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  toggleLike(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.commentService.toggleCommentLike(commentId, req.user.id);
  }
}

@ApiTags('entity-comments')
@Controller(':entityType/:entityId/comments')
@JwtAuth()
@ApiBearerAuth()
export class EntityCommentsController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({
    summary: 'List comments for an entity (paginated, sortable)',
  })
  @ApiOkResponse({ description: 'Paginated comment list' })
  @ApiNotFoundResponse({ description: 'Entity not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(
    @Param('entityType', new ParseEnumPipe(CommentTargetEntity))
    entityType: CommentTargetEntity,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query() query: GetCommentsQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaginatedCommentsResponse> {
    if (entityType === CommentTargetEntity.IDEA) {
      return this.commentService.findIdeaComments(entityId, query, req.user.id);
    }
    return this.commentService.findProblemComments(
      entityId,
      query,
      req.user.id,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 10_000 } })
  @UseGuards(CommentCreateThrottlerGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a comment on an entity' })
  @ApiCreatedResponse({ description: 'Comment created' })
  @ApiNotFoundResponse({ description: 'Entity not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  @UseInterceptors(COMMENT_FILES_INTERCEPTOR)
  create(
    @Param('entityType', new ParseEnumPipe(CommentTargetEntity))
    entityType: CommentTargetEntity,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<CommentDto> {
    const payloadFiles = files ?? [];

    if (entityType === CommentTargetEntity.IDEA) {
      return this.commentService.createIdeaComment(
        entityId,
        dto,
        req.user.id,
        payloadFiles,
      );
    }
    return this.commentService.createProblemComment(
      entityId,
      dto,
      req.user.id,
      payloadFiles,
    );
  }
}
