import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import {
  REALTIME_NAMESPACES,
  realtimeOutboundEventName,
  type RealtimeOutboundEvent,
} from '../realtime/realtime.types';
import { WsAuthService } from '../ws-auth/ws-auth.service';
import { userRoom } from './lib/notification-room.util';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly wsAuth: WsAuthService) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const userId = await this.wsAuth.authenticate(client);

    if (!userId) {
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
    await client.join(userRoom(userId));
    this.logger.debug(`Client ${client.id} joined room ${userRoom(userId)}`);
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const userId = client.data.userId;
    if (!userId) {
      return;
    }

    this.logger.debug(
      `Client ${client.id} disconnected from ${userRoom(userId)}`,
    );
  }

  /**
   * Outbound bridge for the `direct` transport: turns a published broadcast
   * into a socket emit on the root namespace server. This is the only place
   * this gateway touches `this.server`.
   */
  @OnEvent(realtimeOutboundEventName(REALTIME_NAMESPACES.ROOT))
  handleOutbound(event: RealtimeOutboundEvent): void {
    this.server.to(event.room).emit(event.event, event.payload);
  }
}
