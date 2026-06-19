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
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPreconditionFailedResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';

import { IfMatch } from '../../shared/decorators/if-match.decorator';
import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { TagSuggestionService } from '../tag/tag-suggestion.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { GetProblemsQueryDto } from './dto/get-problems-query.dto';
import { MyProblemsQueryDto } from './dto/my-problems.dto';
import { SuggestedIdeasQueryDto } from './dto/suggested-ideas-query.dto';
import { SuggestedTagsQueryDto } from './dto/suggested-tags-query.dto';
import { UpdateProblemDraftDto } from './dto/update-problem-draft.dto';
import { ProblemStage } from './enum/problem-stage.enum';
import { ProblemMemberService } from './problem-member.service';
import { ProblemQueryService } from './problem-query.service';
import { ProblemSuggestedIdeasService } from './problem-suggested-ideas.service';
import { ProblemService } from './problem.service';
import type {
  ProblemFormResponse,
  ProblemsFeedResponse,
} from './types/problem-form.types';
import type { SuggestedIdeasResponse } from './types/suggested-idea.types';
import type { SuggestedTagsResponse } from './types/suggested-tag.types';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('problems')
@Controller('problems')
export class ProblemController {
  constructor(
    private readonly problemService: ProblemService,
    private readonly problemQueryService: ProblemQueryService,
    private readonly problemSuggestedIdeasService: ProblemSuggestedIdeasService,
    private readonly tagSuggestionService: TagSuggestionService,
    private readonly problemMemberService: ProblemMemberService,
  ) {}

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
  findAll(
    @Query() query: GetProblemsQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProblemsFeedResponse> {
    return this.problemService.findAllPublic(query, req.user.id);
  }

  @Get('my-dashboard')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get problems dashboard data with tabs and counters',
  })
  @ApiOkResponse({ description: 'Paginated problems and tab totals' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getMyDashboard(
    @Query() query: MyProblemsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.problemService.getDashboardFeed(req.user.id, query);
  }

  @Get('suggested-ideas')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Suggest ideas to link while creating or editing a problem',
  })
  @ApiOkResponse({ description: 'Ranked idea suggestions' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getSuggestedIdeas(
    @Query() query: SuggestedIdeasQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuggestedIdeasResponse> {
    return this.problemSuggestedIdeasService.getSuggestedIdeas(
      req.user.id,
      query,
    );
  }

  @Get('suggested-tags')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Suggest tags while creating or editing a problem',
  })
  @ApiOkResponse({ description: 'Ranked tag suggestions' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getSuggestedTags(
    @Query() query: SuggestedTagsQueryDto,
  ): Promise<SuggestedTagsResponse> {
    return this.tagSuggestionService
      .suggestTags({ ...query, context: 'problem' })
      .then(result => ({
        data: result.data.map(({ name, label }) => ({ name, label })),
      }));
  }

  @Get(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get problem by ID (author or published)' })
  @ApiOkResponse({ description: 'Problem form payload' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProblemFormResponse> {
    const problem = await this.problemService.findByIdSmart(id, req.user?.id);

    this.problemQueryService
      .trackUniqueView({ problemId: id, userId: req.user?.id })
      .catch(err => console.error(err));

    return problem;
  }

  @Patch(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiHeader({
    name: 'If-Match',
    required: true,
    description: 'Current entity version for optimistic concurrency',
  })
  @ApiOperation({ summary: 'Update a problem (partial)' })
  @ApiBody({ type: UpdateProblemDraftDto })
  @ApiOkResponse({ description: 'Problem updated' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  @ApiPreconditionFailedResponse({
    description: 'Version conflict — current entity returned',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @IfMatch() expectedVersion: number,
    @Body() dto: UpdateProblemDraftDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProblemFormResponse> {
    return this.problemService.update(id, req.user.id, expectedVersion, dto);
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

  @Post(':id/join')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a published problem' })
  @ApiCreatedResponse({ description: 'Joined problem successfully' })
  @ApiNotFoundResponse({ description: 'Problem not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  join(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.problemMemberService.joinProblem(id, req.user.id);
  }

  @Delete(':id/leave')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a problem' })
  @ApiNoContentResponse({ description: 'Left problem successfully' })
  @ApiNotFoundResponse({ description: 'Problem or member not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.problemMemberService.leaveProblem(id, req.user.id);
  }

  @Post(':id/like')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  toggleLike(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.problemService.toggleLike(id, req.user.id);
  }
}
