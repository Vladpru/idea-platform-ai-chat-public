import { Global, Module } from '@nestjs/common';

import { LiveChatModule } from '../modules/live-chat/live-chat.module';
import { RealtimePublisherService } from './realtime-publisher.service';
import { RealtimeUpstreamConsumer } from './realtime-upstream.consumer';

/**
 * Global module exposing {@link RealtimePublisherService} (used app-wide) and
 * running the {@link RealtimeUpstreamConsumer}.
 *
 * Imports LiveChatModule for LiveChatService. This is not a circular dependency:
 * LiveChatModule never imports RealtimeModule — its providers reach
 * RealtimePublisherService through this module's @Global export, not an import.
 */
@Global()
@Module({
  imports: [LiveChatModule],
  providers: [RealtimePublisherService, RealtimeUpstreamConsumer],
  exports: [RealtimePublisherService],
})
export class RealtimeModule {}
