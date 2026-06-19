import { Global, Module } from '@nestjs/common';

import { LiveChatModule } from '../modules/live-chat/live-chat.module';
import { RealtimePublisherService } from './realtime-publisher.service';
import { RealtimeUpstreamConsumer } from './realtime-upstream.consumer';

@Global()
@Module({
  imports: [LiveChatModule],
  providers: [RealtimePublisherService, RealtimeUpstreamConsumer],
  exports: [RealtimePublisherService],
})
export class RealtimeModule {}
