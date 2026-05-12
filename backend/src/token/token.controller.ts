import {
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.tokenService.getRefreshTokenFromCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const { accessToken, refreshToken: newRefresh } =
      await this.tokenService.refreshWithRefreshToken(refreshToken);
    this.tokenService.addRefreshTokenToCookie(res, newRefresh);
    return { accessToken };
  }
}
