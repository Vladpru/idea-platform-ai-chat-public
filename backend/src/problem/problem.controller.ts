import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { ProblemStatus } from '../../generated/prisma/client';
import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { CreateProblemDraftDto } from './dto/create-problem-draft.dto';
import { GetMyProblemsQueryDto } from './dto/get-my-problems-query.dto';
import { ProblemService } from './problem.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('problems')
@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get('mine')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current user problems' })
  @ApiQuery({ name: 'status', required: false, enum: ProblemStatus })
  @ApiOkResponse({ description: 'All problems for the current user' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findMine(
    @Query() query: GetMyProblemsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.problemService.findMine(req.user.id, query);
  }

  @Post('draft')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a problem draft' })
  @ApiBody({ type: CreateProblemDraftDto })
  @ApiCreatedResponse({ description: 'Problem draft created' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  createDraft(
    @Body() dto: CreateProblemDraftDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.problemService.createDraft(req.user.id, dto);
  }
}
