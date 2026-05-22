import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';

import { ProblemStatus } from '../../generated/prisma/client';
import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { CreateProblemDto } from './dto/create-problem.dto';
import { GetProblemsQueryDto } from './dto/get-problems-query.dto';
import { UpdateProblemDraftDto } from './dto/update-problem-draft.dto';
import { ProblemStage } from './enum/problem-stage.enum';
import { ProblemService } from './problem.service';
import type {
  ProblemFormResponse,
  ProblemsFeedResponse,
} from './types/problem-form.types';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('problems')
@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Post()
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a problem as draft or published',
  })
  @ApiBody({ type: CreateProblemDto })
  @ApiCreatedResponse({ description: 'Problem created' })
  @ApiUnprocessableEntityResponse({ description: 'Publish validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  create(
    @Body() dto: CreateProblemDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProblemFormResponse> {
    return this.problemService.create(req.user.id, dto);
  }

  @Get()
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List published problems (public feed)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'stage', required: false, enum: ProblemStage })
  @ApiOkResponse({ description: 'Paginated published problems' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(@Query() query: GetProblemsQueryDto): Promise<ProblemsFeedResponse> {
    return this.problemService.findAllPublic(query);
  }

  @Get('mine')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List current user problems (drafts and published)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'stage', required: false, enum: ProblemStage })
  @ApiQuery({ name: 'status', required: false, enum: ProblemStatus })
  @ApiOkResponse({ description: 'Paginated problems for the current user' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findMine(
    @Query() query: GetProblemsQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProblemsFeedResponse> {
    return this.problemService.findMine(req.user.id, query);
  }

  @Get(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get problem by ID (author or published)' })
  @ApiOkResponse({ description: 'Problem form payload' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProblemFormResponse> {
    return this.problemService.findByIdSmart(id, req.user.id);
  }

  @Patch(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a problem (partial)' })
  @ApiBody({ type: UpdateProblemDraftDto })
  @ApiOkResponse({ description: 'Problem updated' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProblemDraftDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProblemFormResponse> {
    return this.problemService.update(id, req.user.id, dto);
  }

  @Post(':id/media')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a problem attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Attachment uploaded' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType:
              /image\/(jpeg|png|webp)|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProblemFormResponse> {
    return this.problemService.uploadAttachment(id, req.user.id, file);
  }

  @Delete(':id/media/:mediaId')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Media deleted' })
  @ApiNotFoundResponse({ description: 'Problem or media not found' })
  async deleteMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.problemService.deleteMedia(id, mediaId, req.user.id);
  }

  @Delete(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a problem' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Problem deleted' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.problemService.delete(id, req.user.id);
  }
}
