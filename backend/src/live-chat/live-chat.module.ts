import { Module } from '@nestjs/common';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { EntityVisibilityModule } from '../entity-visibility/entity-visibility.module';
import { LivekitModule } from '../livekit/livekit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { LiveChatRateLimitService } from './live-chat-rate-limit.service';
import { LiveChatController } from './live-chat.controller';
import { LiveChatGateway } from './live-chat.gateway';
import { LiveChatRepository } from './live-chat.repository';
import { LiveChatService } from './live-chat.service';
import { LivekitWebhookController } from './livekit-webhook.controller';
import { VideoCallRepository } from './video-call.repository';
import { VideoCallService } from './video-call.service';

@Module({
  imports: [
    PrismaModule,
    EntityVisibilityModule,
    TokenModule,
    LivekitModule,
    CloudinaryModule,
  ],
  controllers: [LiveChatController, LivekitWebhookController],
  providers: [
    LiveChatRepository,
    LiveChatRateLimitService,
    LiveChatService,
    LiveChatGateway,
    VideoCallRepository,
    VideoCallService,
  ],
  exports: [LiveChatService, VideoCallService],
})
export class LiveChatModule {}
