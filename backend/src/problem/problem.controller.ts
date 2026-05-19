import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { CreateProblemDraftDto } from './dto/create-problem-draft.dto';
import { ProblemService } from './problem.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('problems')
@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

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
