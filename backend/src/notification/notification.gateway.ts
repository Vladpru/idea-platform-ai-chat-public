import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { PrismaService } from '../prisma/prisma.service';
import { resolveUserIdFromSocket } from './lib/ws-auth.util';
import type { NotificationSignalEvent } from './types/notification.types';

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

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
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
    await client.join(this.userRoom(userId));
    this.logger.debug(
      `Client ${client.id} joined room ${this.userRoom(userId)}`,
    );
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const userId = client.data.userId;
    if (!userId) {
      return;
    }

    this.logger.debug(
      `Client ${client.id} disconnected from ${this.userRoom(userId)}`,
    );
  }

  notifyUser(userId: string): void {
    const payload: NotificationSignalEvent = { type: 'NOTIFICATION_NEW' };
    this.server.to(this.userRoom(userId)).emit('notification', payload);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
}
