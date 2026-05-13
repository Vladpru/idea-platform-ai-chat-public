import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { User } from '../../generated/prisma/client';
import { TokenService } from '../token/token.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

type GoogleProfileRaw = {
  email?: string;
  name?: string;
  given_name?: string;
  picture?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.userService.create(dto);

    return this.finalizeAuth(user);
  }

  async login(dto: CreateUserDto) {
    if (!dto.password) {
      throw new BadRequestException('Password required');
    }
    const user = await this.userService.verifyUser(dto.email, dto.password);

    return this.finalizeAuth(user);
  }

  async googleLogin(googleToken: string | undefined) {
    if (!googleToken?.trim()) {
      throw new UnauthorizedException(
        'Google token is required (send `token` or `credential` in the JSON body)',
      );
    }

    const raw = await this.fetchGoogleProfile(googleToken.trim());
    const email = raw.email;
    if (!email) {
      throw new UnauthorizedException(
        'Google token is invalid or email is missing',
      );
    }

    const realName =
      typeof raw.name === 'string'
        ? raw.name
        : typeof raw.given_name === 'string'
          ? raw.given_name
          : undefined;

    const user = await this.userService.upsertOAuthUser({
      email,
      realName,
      avatar_url: typeof raw.picture === 'string' ? raw.picture : undefined,
    });

    return this.finalizeAuth(user);
  }

  private async fetchGoogleProfile(token: string): Promise<GoogleProfileRaw> {
    const isJwt = token.split('.').length === 3;
    if (isJwt) {
      const params = new URLSearchParams({ id_token: token });
      return this.fetchJson<GoogleProfileRaw>(
        `https://oauth2.googleapis.com/tokeninfo?${params}`,
        'Failed to validate Google ID token',
      );
    }
    return this.fetchJson<GoogleProfileRaw>(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      'Failed to fetch Google user info',
      { Authorization: `Bearer ${token}` },
    );
  }

  private async finalizeAuth(user: User) {
    const tokens = this.tokenService.issueTokens(user.id);

    const userProfile = await this.userService.findOne(user.id);

    return {
      user: userProfile,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async fetchJson<T>(
    url: string,
    errorMsg: string,
    headers: HeadersInit = {},
  ): Promise<T> {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new UnauthorizedException(`${errorMsg}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }
}
