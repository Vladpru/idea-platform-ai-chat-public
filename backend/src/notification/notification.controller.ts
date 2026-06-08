import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { NotificationService } from './notification.service';
import type {
  NotificationDto,
  PaginatedNotificationsResponse,
  UnreadCountResponse,
} from './types/notification.types';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiOkResponse({ description: 'Paginated notifications' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetNotificationsQueryDto,
  ): Promise<PaginatedNotificationsResponse> {
    return this.notificationService.findAll(req.user.id, query);
  }

  @Get('unread-count')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiOkResponse({ description: 'Unread count' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getUnreadCount(
    @Req() req: AuthenticatedRequest,
  ): Promise<UnreadCountResponse> {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Patch('read-all')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({ description: 'Bulk read result' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  markAllAsRead(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ updatedCount: number }> {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete('all')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete all notifications for the current user' })
  @ApiOkResponse({ description: 'Bulk delete result' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  deleteAll(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ deletedCount: number }> {
    return this.notificationService.deleteAll(req.user.id);
  }

  @Patch(':id/read')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiOkResponse({ description: 'Updated notification' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<NotificationDto> {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @Delete(':id')
  @JwtAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiOkResponse({ description: 'Notification deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.notificationService.delete(req.user.id, id);
  }
}
