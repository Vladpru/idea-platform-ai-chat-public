import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy, type StrategyOptions } from 'passport-jwt';

import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-strategy') {
  constructor(
    private readonly config: ConfigService,
    private readonly userService: UserService,
  ) {
    const jwtSecretRaw = config.get<string>('JWT_SECRET');
    if (jwtSecretRaw === undefined || jwtSecretRaw === '') {
      throw new Error('JWT_SECRET is not set');
    }

    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecretRaw,
    };
    super(options);
  }

  async validate({ id }: { id: string }) {
    return await this.userService.findOne(id);
  }
}
