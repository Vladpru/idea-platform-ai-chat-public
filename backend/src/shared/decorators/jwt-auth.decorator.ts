import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const jwtAuthGuard = AuthGuard('jwt-strategy');

export function JwtAuth() {
  return applyDecorators(UseGuards(jwtAuthGuard));
}
