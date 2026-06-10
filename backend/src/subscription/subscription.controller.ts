import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { SubscriptionService } from './subscription.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('users')
@Controller('users')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post(':id/subscribe')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to a user' })
  @ApiOkResponse({ description: 'Subscribed successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Already subscribed' })
  async subscribe(
    @Param('id', ParseUUIDPipe) followingId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.subscriptionService.subscribe(req.user.id, followingId);
    return { subscribed: true };
  }

  @Delete(':id/subscribe')
  @JwtAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unsubscribe from a user' })
  @ApiNoContentResponse({ description: 'Unsubscribed successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Subscription not found' })
  async unsubscribe(
    @Param('id', ParseUUIDPipe) followingId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.subscriptionService.unsubscribe(req.user.id, followingId);
  }
}
