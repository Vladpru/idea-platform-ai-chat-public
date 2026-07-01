import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import {
  ENTITY_LINK_TARGETS,
  type EntityLinkTarget,
} from '../entity-visibility/entity-target.enum';
import {
  CreateLiveChatRoomDto,
  CreateVideoCallDto,
  GetLiveChatMessagesQueryDto,
  UpdateVideoCallDto,
} from './dto';
import type { LiveChatAttachmentPayload } from './live-chat.service';
import { LiveChatService } from './live-chat.service';
import type {
  LiveChatRoomDto,
  LiveChatRoomListResponse,
  PaginatedLiveChatMessagesResponse,
} from './types/live-chat.types';
import type {
  JoinVideoCallResponse,
  VideoCallDto,
  VideoCallListResponse,
} from './types/video-call.types';
import { VideoCallService } from './video-call.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@ApiTags('live-chats')
@Controller('live-chats')
@JwtAuth()
@ApiBearerAuth()
export class LiveChatController {
  constructor(
    private readonly liveChatService: LiveChatService,
    private readonly videoCallService: VideoCallService,
  ) {}

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

  @Post('direct/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or return a direct live chat with a user' })
  @ApiCreatedResponse({ description: 'Direct live chat room' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  createDirectRoom(
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<LiveChatRoomDto> {
    return this.liveChatService.createOrGetDirectRoom(
      targetUserId,
      req.user.id,
    );
  }

  @Get('by-entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get live chat room for an idea or problem' })
  @ApiOkResponse({ description: 'Live chat room' })
  @ApiNotFoundResponse({ description: 'Entity or room not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findByEntity(
    @Param('entityType', new ParseEnumPipe(ENTITY_LINK_TARGETS))
    entityType: EntityLinkTarget,
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

  @Post(':roomId/messages/upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload an attachment for a live chat message' })
  @ApiCreatedResponse({ description: 'Uploaded attachment metadata' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'No file provided' })
  uploadMessageAttachment(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<LiveChatAttachmentPayload> {
    return this.liveChatService.uploadMessageAttachment(
      roomId,
      req.user.id,
      file,
    );
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

  @Get(':roomId/calls')
  @ApiOperation({ summary: 'List active and upcoming video calls for a room' })
  @ApiOkResponse({ description: 'Video call list' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  listVideoCalls(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<VideoCallListResponse> {
    return this.videoCallService.listCalls(roomId, req.user.id);
  }

  @Post(':roomId/calls')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an ad-hoc or scheduled video call' })
  @ApiCreatedResponse({ description: 'Video call' })
  @ApiNotFoundResponse({ description: 'Room not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  createVideoCall(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: CreateVideoCallDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<VideoCallDto> {
    return this.videoCallService.createCall(
      roomId,
      req.user.id,
      dto.scheduledFor,
    );
  }

  @Patch(':roomId/calls/:callId')
  @ApiOperation({ summary: 'Start, end, or cancel a video call' })
  @ApiOkResponse({ description: 'Updated video call' })
  @ApiNotFoundResponse({ description: 'Room or call not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  updateVideoCall(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('callId', ParseUUIDPipe) callId: string,
    @Body() dto: UpdateVideoCallDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<VideoCallDto> {
    return this.videoCallService.updateCall(
      roomId,
      callId,
      req.user.id,
      dto.action,
    );
  }

  @Post(':roomId/calls/:callId/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a video call and receive a LiveKit token' })
  @ApiOkResponse({ description: 'LiveKit join credentials' })
  @ApiNotFoundResponse({ description: 'Room or call not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({ description: 'Call is not live' })
  joinVideoCall(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('callId', ParseUUIDPipe) callId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<JoinVideoCallResponse> {
    return this.videoCallService.joinCall(roomId, callId, req.user.id);
  }
}
