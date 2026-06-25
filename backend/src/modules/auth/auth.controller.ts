import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { TokenService } from '../token/token.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.register(dto);
    this.tokenService.addAccessTokenToCookie(res, accessToken);
    this.tokenService.addRefreshTokenToCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('login')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);
    this.tokenService.addAccessTokenToCookie(res, accessToken);
    this.tokenService.addRefreshTokenToCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('google')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async googleLogin(
    @Body() body: { token?: string; credential?: string } | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = body?.token ?? body?.credential;
    const { user, accessToken, refreshToken } =
      await this.authService.googleLogin(token);
    this.tokenService.addAccessTokenToCookie(res, accessToken);
    this.tokenService.addRefreshTokenToCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.tokenService.logout(res);
  }
}
