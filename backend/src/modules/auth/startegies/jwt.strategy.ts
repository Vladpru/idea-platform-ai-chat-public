import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy, type StrategyOptions } from 'passport-jwt';

import { PrismaService } from '../../../core/prisma/prisma.service';

function extractJwtFromCookieOrHeader(req: Request): string | null {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const cookieToken = cookies?.accessToken;
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-strategy') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecretRaw = config.get<string>('JWT_SECRET');
    if (jwtSecretRaw === undefined || jwtSecretRaw === '') {
      throw new Error('JWT_SECRET is not set');
    }

    const options: StrategyOptions = {
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: jwtSecretRaw,
    };
    super(options);
  }

  async validate({ id }: { id: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
