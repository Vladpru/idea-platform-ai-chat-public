import { Module } from '@nestjs/common';

import { TokenModule } from '../modules/token/token.module';
import { WsAuthService } from './ws-auth.service';

@Module({
  imports: [TokenModule],
  providers: [WsAuthService],
  exports: [WsAuthService],
})
export class WsAuthModule {}
