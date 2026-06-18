import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import type { IdeaFormResponseWithProblem } from '../idea/types/idea-form.types';
import type { ProblemFormResponse } from '../problem/types/problem-form.types';
import { SimilarityQueryDto } from './dto/similarity-query.dto';
import { SimilarityTextThrottlerGuard } from './guards/similarity-text-throttler.guard';
import { SimilarityService } from './similarity.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('similarity')
@Controller('similarity')
export class SimilarityController {
  constructor(private readonly similarityService: SimilarityService) {}

  @Get()
  @JwtAuth()
  @ApiBearerAuth()
  @UseGuards(SimilarityTextThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Find similar ideas or problems (hybrid search)' })
  @ApiOkResponse({ description: 'Ranked similar entities' })
  @ApiBadRequestResponse({
    description: 'Invalid query or both/neither sourceId and text',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findSimilar(
    @Query() dto: SimilarityQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<IdeaFormResponseWithProblem[] | ProblemFormResponse[]> {
    return this.similarityService.findSimilar({
      entityType: dto.entityType,
      limit: dto.limit,
      userId: req.user.id,
      sourceId: dto.sourceId,
      text: dto.text,
    });
  }
}
