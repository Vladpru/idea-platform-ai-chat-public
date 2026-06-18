import { Module } from '@nestjs/common';

import { TokenModule } from '../token/token.module';
import { WsAuthService } from './ws-auth.service';

/**
 * Provides {@link WsAuthService} to the WebSocket gateways. TokenModule supplies
 * JwtService; PrismaService is available via the global PrismaModule.
 */
@Module({
  imports: [TokenModule],
  providers: [WsAuthService],
  exports: [WsAuthService],
})
export class WsAuthModule {}
