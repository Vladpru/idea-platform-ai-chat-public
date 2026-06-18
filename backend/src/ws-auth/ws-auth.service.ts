import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

import { resolveUserIdFromSocket } from '../notification/lib/ws-auth.util';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Shared WebSocket connection authentication, extracted from the live-chat and
 * notification gateways so neither has to know about Prisma.
 *
 * Returns the authenticated user id, or `null` when the handshake should be
 * rejected.
 *
 * NOTE (strangler caveat): the Prisma existence check below is a Phase-0
 * relocation only. The future FastAPI edge validates the JWT cryptographically
 * with zero DB access, so this lookup is slated for removal at cutover
 * (decode-and-trust). Do not build new behaviour on it.
 */
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
