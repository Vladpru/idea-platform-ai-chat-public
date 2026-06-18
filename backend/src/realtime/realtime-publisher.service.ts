import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { RedisService } from '../redis/redis.service';
import {
  DownstreamEnvelope,
  EDGE_DOWNSTREAM_MAXLEN,
  EDGE_DOWNSTREAM_STREAM,
  RealtimeOutboundEvent,
  RealtimeTarget,
  RealtimeTransport,
  realtimeOutboundEventName,
} from './realtime.types';

/**
 * Single seam for all outbound realtime broadcasts. Replaces direct
 * `server.to(room).emit()` calls scattered across the gateways and services.
 *
 * - `direct` (default): emits an in-process EventEmitter2 event that the owning
 *   gateway turns into a real socket emit. Keeps the Socket.IO `Server` handle
 *   confined to the gateways and avoids a publisher↔gateway circular dependency.
 * - `redis`: appends a {@link DownstreamEnvelope} to the `edge:downstream`
 *   stream for the future FastAPI edge. Dark until that edge exists.
 *
 * Fire-and-forget, mirroring the original `server.emit()` semantics (callers
 * never awaited the broadcast).
 */
@Injectable()
export class RealtimePublisherService {
  private readonly logger = new Logger(RealtimePublisherService.name);
  private readonly transport: RealtimeTransport;

  constructor(
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redis: RedisService,
  ) {
    const configured = this.config.get<string>('REALTIME_TRANSPORT');
    this.transport =
      configured === RealtimeTransport.Redis
        ? RealtimeTransport.Redis
        : RealtimeTransport.Direct;
    this.logger.log(`Realtime transport: ${this.transport}`);
  }

  publish(target: RealtimeTarget, event: string, payload: unknown): void {
    if (this.transport === RealtimeTransport.Redis) {
      void this.publishToRedis(target, event, payload).catch(error => {
        this.logger.error(
          `Failed to publish "${event}" to ${EDGE_DOWNSTREAM_STREAM}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
      return;
    }

    this.publishDirect(target, event, payload);
  }

  private publishDirect(
    target: RealtimeTarget,
    event: string,
    payload: unknown,
  ): void {
    const outbound: RealtimeOutboundEvent = { room: target.room, event, payload };
    this.eventEmitter.emit(realtimeOutboundEventName(target.namespace), outbound);
  }

  private async publishToRedis(
    target: RealtimeTarget,
    event: string,
    payload: unknown,
  ): Promise<void> {
    const envelope: DownstreamEnvelope = {
      v: 1,
      namespace: target.namespace,
      target: { type: 'room', room: target.room },
      event,
      payload,
      meta: {
        id: randomUUID(),
        ts: new Date().toISOString(),
        source: 'monolith',
      },
    };

    await this.redis.xadd(
      EDGE_DOWNSTREAM_STREAM,
      { payload: JSON.stringify(envelope) },
      EDGE_DOWNSTREAM_MAXLEN,
    );
  }
}
