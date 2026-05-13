import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { TokenService } from '../token/token.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.register(dto);
    this.tokenService.addRefreshTokenToCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('login')
  async login(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);
    this.tokenService.addRefreshTokenToCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('google')
  async googleLogin(
    @Body() body: { token?: string; credential?: string } | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = body?.token ?? body?.credential;
    const { user, accessToken, refreshToken } =
      await this.authService.googleLogin(token);
    this.tokenService.addRefreshTokenToCookie(res, refreshToken);
    return { user, accessToken };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.tokenService.logout(res);
  }
}
