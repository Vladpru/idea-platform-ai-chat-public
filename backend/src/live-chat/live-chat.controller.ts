import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { EntityTarget } from '../entity-visibility/entity-target.enum';
import { JwtAuth } from '../shared/decorators/jwt-auth.decorator';
import { CreateLiveChatRoomDto, GetLiveChatMessagesQueryDto } from './dto';
import { LiveChatService } from './live-chat.service';
import type {
  LiveChatRoomDto,
  LiveChatRoomListResponse,
  PaginatedLiveChatMessagesResponse,
} from './types/live-chat.types';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('live-chats')
@Controller('live-chats')
@JwtAuth()
@ApiBearerAuth()
export class LiveChatController {
  constructor(private readonly liveChatService: LiveChatService) {}

  @Get()
  @ApiOperation({ summary: 'List live chat rooms accessible to the user' })
  @ApiOkResponse({ description: 'Live chat room list' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  listRooms(
    @Req() req: AuthenticatedRequest,
  ): Promise<LiveChatRoomListResponse> {
    return this.liveChatService.listRooms(req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or return an existing live chat room' })
  @ApiCreatedResponse({ description: 'Live chat room' })
  @ApiNotFoundResponse({ description: 'Entity not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  createRoom(
    @Body() dto: CreateLiveChatRoomDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<LiveChatRoomDto> {
    return this.liveChatService.createOrGetRoom(
      dto.entityType,
      dto.entityId,
      req.user.id,
    );
  }

  @Get('by-entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get live chat room for an idea or problem' })
  @ApiOkResponse({ description: 'Live chat room' })
  @ApiNotFoundResponse({ description: 'Entity or room not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findByEntity(
    @Param('entityType', new ParseEnumPipe(EntityTarget))
    entityType: EntityTarget,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<LiveChatRoomDto> {
    return this.liveChatService.findRoomByEntity(
      entityType,
      entityId,
      req.user.id,
    );
  }

  @Get(':roomId')
  @ApiOperation({ summary: 'Get live chat room metadata' })
  @ApiOkResponse({ description: 'Live chat room' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findRoom(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<LiveChatRoomDto> {
    return this.liveChatService.findRoomById(roomId, req.user.id);
  }

  @Get(':roomId/messages')
  @ApiOperation({ summary: 'List live chat messages for a room' })
  @ApiOkResponse({ description: 'Paginated live chat messages' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findMessages(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query() query: GetLiveChatMessagesQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaginatedLiveChatMessagesResponse> {
    return this.liveChatService.findMessages(roomId, req.user.id, query);
  }
}
