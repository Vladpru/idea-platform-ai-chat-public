import {
  Logger,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { IsUUID } from 'class-validator';
import type { Server, Socket } from 'socket.io';

import {
  REALTIME_NAMESPACES,
  ROOM_CONTROL_EVENTS,
  type RealtimeOutboundEvent,
  realtimeOutboundEventName,
} from '../../realtime/realtime.types';
import { WsAuthService } from '../../ws-auth/ws-auth.service';
import { SendLiveChatMessagePayloadDto } from './dto/send-live-chat-message.dto';
import { liveChatRoomName } from './live-chat.constants';
import { LiveChatService } from './live-chat.service';
import type { LiveChatMessageDto } from './types/live-chat.types';

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
    private readonly wsAuth: WsAuthService,
    private readonly liveChatService: LiveChatService,
  ) {}

  async handleConnection(client: AuthenticatedLiveChatSocket): Promise<void> {
    const userId = await this.wsAuth.authenticate(client);

    if (!userId) {
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
  ): Promise<void> {
    const userId = client.data.userId;
    if (!userId) {
      client.emit(ROOM_CONTROL_EVENTS.JOIN_DENIED, {
        roomId: payload.roomId,
        reason: 'Unauthorized',
      });
      return;
    }

    try {
      await this.liveChatService.assertRoomAccess(payload.roomId, userId);
    } catch (error) {
      const reason =
        error instanceof NotFoundException ? 'Room not found' : 'Access denied';
      client.emit(ROOM_CONTROL_EVENTS.JOIN_DENIED, {
        roomId: payload.roomId,
        reason,
      });
      return;
    }

    await client.join(liveChatRoomName(payload.roomId));
    client.emit(ROOM_CONTROL_EVENTS.JOIN_APPROVED, { roomId: payload.roomId });
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
    await client.leave(liveChatRoomName(payload.roomId));
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
      const message = await this.liveChatService.processInboundMessage(
        userId,
        payload,
      );
      return { ok: true, message };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send message';
      return { ok: false, error: message };
    }
  }

  @OnEvent(realtimeOutboundEventName(REALTIME_NAMESPACES.LIVE_CHAT))
  handleOutbound(event: RealtimeOutboundEvent): void {
    this.server.to(event.room).emit(event.event, event.payload);
  }
}
