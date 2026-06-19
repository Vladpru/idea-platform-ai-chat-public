import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

import { resolveUserIdFromSocket } from '../modules/notification/lib/ws-auth.util';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class WsAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async authenticate(client: Socket): Promise<string | null> {
    const refreshCookieName =
      this.config.get<string>('TOKEN_COOKIE_NAME') ?? 'refreshToken';

    const userId = await resolveUserIdFromSocket(
      client,
      this.jwt,
      refreshCookieName,
    );

    if (!userId) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    return userId;
  }
}
