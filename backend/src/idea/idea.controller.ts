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
  Put,
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

import { IdeaStatus } from '../../generated/prisma/client';
import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { GetIdeasQueryDto } from './dto/get-ideas-query.dto';
import { UpdateIdeaDraftDto } from './dto/update-idea-draft.dto';
import { UpdatePublishedIdeaDto } from './dto/update-published-idea.dto';
import { Stage } from './enum/stage.enum';
import { IdeaService } from './idea.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('ideas')
@Controller('ideas')
export class IdeaController {
  constructor(private readonly ideaService: IdeaService) {}

  @Post()
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an idea as draft or published',
  })
  @ApiBody({ type: CreateIdeaDto })
  @ApiCreatedResponse({ description: 'Idea created' })
  @ApiUnprocessableEntityResponse({ description: 'Publish validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  create(@Body() dto: CreateIdeaDto, @Req() req: AuthenticatedRequest) {
    return this.ideaService.create(req.user.id, dto);
  }

  @Get()
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List published ideas (public feed)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'stage', required: false, enum: Stage })
  @ApiOkResponse({ description: 'Paginated published ideas' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(@Query() query: GetIdeasQueryDto) {
    return this.ideaService.findAllPublic(query);
  }

  @Get('mine')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current user ideas (drafts and published)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'stage', required: false, enum: Stage })
  @ApiQuery({ name: 'status', required: false, enum: IdeaStatus })
  @ApiOkResponse({ description: 'Paginated ideas for the current user' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findMine(@Query() query: GetIdeasQueryDto, @Req() req: AuthenticatedRequest) {
    return this.ideaService.findMyIdeas(req.user.id, query);
  }

  @Get(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get idea by ID (author or published)' })
  @ApiOkResponse({ description: 'Idea form payload' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ideaService.findByIdSmart(id, req.user.id);
  }

  @Patch(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save idea draft (partial update)' })
  @ApiBody({ type: UpdateIdeaDraftDto })
  @ApiOkResponse({ description: 'Draft idea updated' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updateDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIdeaDraftDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ideaService.updateDraft(id, req.user.id, dto);
  }

  @Put(':id/main-image')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload or replace the main image for an idea' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Main image uploaded' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, //5MB
    }),
  )
  uploadMainImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ideaService.uploadMainImage(id, req.user.id, file);
  }

  @Post(':id/media')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload an idea attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Attachment uploaded' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAttachment(
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
  ) {
    return this.ideaService.uploadAttachment(id, req.user.id, file);
  }

  @Delete(':id/media/:mediaId')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Media deleted' })
  @ApiNotFoundResponse({ description: 'Idea or media not found' })
  deleteMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.ideaService.deleteMedia(id, mediaId, req.user.id);
  }

  @Delete(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete an idea (hard delete draft or published)',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Idea deleted' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.ideaService.delete(id, req.user.id);
  }

  @Post(':id/publish')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a draft idea' })
  @ApiOkResponse({ description: 'Idea published' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @ApiUnprocessableEntityResponse({ description: 'Publish validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ideaService.publish(id, req.user.id);
  }

  @Patch(':id/publish')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a published idea (strict validation)' })
  @ApiBody({ type: UpdatePublishedIdeaDto })
  @ApiOkResponse({ description: 'Published idea updated' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @ApiUnprocessableEntityResponse({ description: 'Update validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updatePublished(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePublishedIdeaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ideaService.updatePublished(id, req.user.id, dto);
  }

  @Get(':id/similar')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top 3 similar ideas based on text relevance' })
  @ApiOkResponse({ description: 'Array of top 3 similar ideas' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  findSimilar(@Param('id', ParseUUIDPipe) id: string) {
    return this.ideaService.findSimilar(id);
  }

  @Post(':id/join')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a published idea' })
  @ApiCreatedResponse({ description: 'Joined idea successfully' })
  @ApiNotFoundResponse({ description: 'Idea not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  join(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ideaService.joinIdea(id, req.user.id);
  }

  @Delete(':id/leave')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave an idea' })
  @ApiNoContentResponse({ description: 'Left idea successfully' })
  @ApiNotFoundResponse({ description: 'Idea or member not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.ideaService.leaveIdea(id, req.user.id);
  }
}
