import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import livekitConfig from '../config/livekit.config';
import { LivekitRoomService } from './livekit-room.service';
import { LivekitTokenService } from './livekit-token.service';

@Module({
  imports: [ConfigModule.forFeature(livekitConfig)],
  providers: [LivekitTokenService, LivekitRoomService],
  exports: [LivekitTokenService, LivekitRoomService],
})
export class LivekitModule {}
