import { Global, Module } from '@nestjs/common';

import { RealtimePublisherService } from './realtime-publisher.service';

/**
 * Global module exposing {@link RealtimePublisherService}. Depends only on
 * already-global providers (ConfigService, EventEmitter2, RedisService), so no
 * imports are required here.
 */
@Global()
@Module({
  providers: [RealtimePublisherService],
  exports: [RealtimePublisherService],
})
export class RealtimeModule {}
