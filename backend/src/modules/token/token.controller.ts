import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { JwtAuth } from '../../shared/decorators/jwt-auth.decorator';
import { TokenService } from './token.service';

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('ws')
  @JwtAuth()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  issueWsToken(@Req() req: AuthenticatedRequest) {
    return { token: this.tokenService.issueWsToken(req.user.id) };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.tokenService.getRefreshTokenFromCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    const { accessToken, refreshToken: newRefresh } =
      await this.tokenService.refreshWithRefreshToken(refreshToken);
    this.tokenService.addRefreshTokenToCookie(res, newRefresh);
    this.tokenService.addAccessTokenToCookie(res, accessToken);
    return { accessToken };
  }
}
