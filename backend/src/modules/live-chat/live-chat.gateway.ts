import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
} from 'class-validator';
import type { Server, Socket } from 'socket.io';

import { resolveUserIdFromSocket } from '../notification/lib/ws-auth.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SendLiveChatMessageDto } from './dto/send-live-chat-message.dto';
import { LiveChatService } from './live-chat.service';
import type { LiveChatMessageDto } from './types/live-chat.types';
import type {
  VideoCallDto,
  VideoCallLifecyclePayload,
} from './types/video-call.types';

export interface AuthenticatedLiveChatSocket extends Socket {
  data: {
    userId?: string;
  };
}

class JoinLiveChatRoomDto {
  @IsUUID()
  roomId!: string;
}

class LeaveLiveChatRoomDto {
  @IsUUID()
  roomId!: string;
}

class SendLiveChatMessagePayloadDto extends SendLiveChatMessageDto {
  @IsUUID()
  roomId!: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  attachmentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  attachmentMimeType?: string;
}

@WebSocketGateway({
  namespace: 'live-chat',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class LiveChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(LiveChatGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly liveChatService: LiveChatService,
  ) {}

  async handleConnection(client: AuthenticatedLiveChatSocket): Promise<void> {
    const refreshCookieName =
      this.config.get<string>('TOKEN_COOKIE_NAME') ?? 'refreshToken';

    const userId = await resolveUserIdFromSocket(
      client,
      this.jwt,
      refreshCookieName,
    );

    if (!userId) {
      client.disconnect(true);
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
    client.emit('connection_ready');
    this.logger.debug(`Live chat client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedLiveChatSocket): void {
    this.logger.debug(`Live chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedLiveChatSocket,
    @MessageBody() payload: JoinLiveChatRoomDto,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const userId = client.data.userId;
    if (!userId) {
      return { ok: false, error: 'Unauthorized' };
    }

    try {
      await this.liveChatService.assertRoomAccess(payload.roomId, userId);
      await client.join(this.roomName(payload.roomId));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Room not found' };
    }
  }

  @SubscribeMessage('leave_room')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedLiveChatSocket,
    @MessageBody() payload: LeaveLiveChatRoomDto,
  ): Promise<{ ok: true }> {
    await client.leave(this.roomName(payload.roomId));
    return { ok: true };
  }

  @SubscribeMessage('send_message')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedLiveChatSocket,
    @MessageBody() payload: SendLiveChatMessagePayloadDto,
  ): Promise<
    { ok: true; message: LiveChatMessageDto } | { ok: false; error: string }
  > {
    const userId = client.data.userId;
    if (!userId) {
      return { ok: false, error: 'Unauthorized' };
    }

    try {
      const attachment = payload.attachmentUrl
        ? {
            url: payload.attachmentUrl,
            name: payload.attachmentName ?? payload.attachmentUrl,
            mimeType: payload.attachmentMimeType ?? 'application/octet-stream',
          }
        : null;

      const { message, isDuplicate } = await this.liveChatService.sendMessage(
        payload.roomId,
        userId,
        payload.content,
        payload.clientMessageId,
        attachment,
      );

      if (!isDuplicate) {
        this.server.to(this.roomName(payload.roomId)).emit('message', message);
      }

      return { ok: true, message };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send message';
      return { ok: false, error: message };
    }
  }

  emitCallScheduled(roomId: string, call: VideoCallDto): void {
    this.server.to(this.roomName(roomId)).emit('call_scheduled', call);
  }

  emitCallStarted(roomId: string, call: VideoCallDto): void {
    this.server.to(this.roomName(roomId)).emit('call_started', call);
  }

  emitCallEnded(roomId: string, payload: VideoCallLifecyclePayload): void {
    this.server.to(this.roomName(roomId)).emit('call_ended', payload);
  }

  emitCallCancelled(roomId: string, payload: VideoCallLifecyclePayload): void {
    this.server.to(this.roomName(roomId)).emit('call_cancelled', payload);
  }

  private roomName(roomId: string): string {
    return `live-chat:${roomId}`;
  }
}
