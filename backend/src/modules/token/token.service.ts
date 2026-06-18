import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

import { isDev } from '../../shared/utils/is-dev.util';

function decodeRefreshPayload(
  jwt: JwtService,
  refreshToken: string,
): JwtPayload | null {
  const decodedUnknown: unknown = jwt.decode(refreshToken);
  if (
    decodedUnknown === null ||
    typeof decodedUnknown !== 'object' ||
    !('exp' in decodedUnknown) ||
    typeof Reflect.get(decodedUnknown, 'exp') !== 'number'
  ) {
    return null;
  }
  return decodedUnknown as JwtPayload;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private refreshCookieName(): string {
    return this.config.get<string>('TOKEN_COOKIE_NAME') ?? 'refreshToken';
  }

  private isDevMode(): boolean {
    return isDev(this.config);
  }

  getRefreshTokenFromCookie(req: Request): string | undefined {
    const name = this.refreshCookieName();
    const jar = req.cookies as Record<string, string | undefined> | undefined;
    const raw = jar?.[name];
    return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
  }

  async refreshWithRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ id?: unknown }>(
        refreshToken,
      );
      const userId = payload?.id;
      if (typeof userId !== 'string' || userId.length === 0) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.issueTokens(userId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  issueTokens(userId: string): { accessToken: string; refreshToken: string } {
    try {
      const payload = { id: userId };
      const accessToken = this.jwt.sign(payload, {
        expiresIn: this.config.getOrThrow<string>(
          'ACCESS_TOKEN_EXPIRE',
        ) as JwtSignOptions['expiresIn'],
      });
      const refreshToken = this.jwt.sign(payload, {
        expiresIn: this.config.getOrThrow<string>(
          'REFRESH_TOKEN_EXPIRE',
        ) as JwtSignOptions['expiresIn'],
      });

      return { accessToken, refreshToken };
    } catch {
      throw new BadRequestException("Couldn't issue new jwt tokens");
    }
  }

  addRefreshTokenToCookie(res: Response, refreshToken: string) {
    try {
      const decoded = decodeRefreshPayload(this.jwt, refreshToken);
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const maxAge =
        decoded?.exp !== undefined
          ? Math.max(0, decoded.exp * 1000 - Date.now()) + 1000
          : sevenDaysMs;

      const domain = this.isDevMode()
        ? undefined
        : this.config.get<string>('SERVER_DOMAIN');

      res.cookie(this.refreshCookieName(), refreshToken, {
        httpOnly: true,
        domain,
        secure: !this.isDevMode(),
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
    } catch {
      throw new BadRequestException();
    }
  }

  logout(res: Response) {
    this.removeRefreshTokenFromCookie(res);
    return { message: 'Logged out successfully' };
  }

  private removeRefreshTokenFromCookie(res: Response) {
    const domain = this.isDevMode()
      ? undefined
      : this.config.get<string>('SERVER_DOMAIN');

    try {
      res.clearCookie(this.refreshCookieName(), {
        httpOnly: true,
        path: '/',
        domain,
        secure: !this.isDevMode(),
        sameSite: 'lax',
      });
    } catch {
      throw new BadRequestException('Error logging out');
    }
  }
}
