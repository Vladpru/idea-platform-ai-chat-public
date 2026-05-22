import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { MailService } from '../mail/mail.service';
import type { UserPublic } from '../shared/types/user.types';
import { TokenService } from '../token/token.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpsertOAuthUserResult } from '../user/dto/upsert-oauth-user.dto';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';

type GoogleProfileRaw = {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    await this.mailService.sendWelcomeEmail({ to: user.email });
    return this.finalizeAuth(user);
  }

  async login(dto: LoginDto) {
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

    const firstName =
      raw.given_name || (raw.name ? raw.name.split(' ')[0] : undefined);
    const lastName =
      raw.family_name ||
      (raw.name && raw.name.includes(' ')
        ? raw.name.substring(raw.name.indexOf(' ') + 1)
        : undefined);

    const oauthUpsert: UpsertOAuthUserResult =
      await this.userService.upsertOAuthUser({
        email,
        firstName,
        lastName,
        avatarUrl: typeof raw.picture === 'string' ? raw.picture : undefined,
      });

    if (oauthUpsert.isNewUser) {
      try {
        await this.mailService.sendWelcomeEmail({
          to: oauthUpsert.user.email,
        });
      } catch (error: unknown) {
        this.logger.error(
          `Failed to send OAuth welcome email to ${oauthUpsert.user.email}`,
          error,
        );
      }
    }

    return this.finalizeAuth(oauthUpsert.user);
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

  private async finalizeAuth(user: { id: string }) {
    const tokens = this.tokenService.issueTokens(user.id);
    const userProfile: UserPublic = await this.userService.getProfileForUser(
      user.id,
    );

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
