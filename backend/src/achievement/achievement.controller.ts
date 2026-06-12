import { Controller, Get, Patch, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { AchievementService } from './achievement.service';
import type { UserAchievementDto } from './dto/user-achievement.dto';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('achievements')
@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get('me')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my achievements with progress' })
  @ApiOkResponse({ description: 'List of all achievements with unlock status' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getMyAchievements(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserAchievementDto[]> {
    return this.achievementService.getMyAchievements(req.user.id);
  }

  @Patch('me/seen')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all new achievements as seen' })
  @ApiOkResponse({ description: 'Achievements marked as seen' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async markSeen(@Req() req: AuthenticatedRequest): Promise<void> {
    await this.achievementService.markSeen(req.user.id);
  }
}
