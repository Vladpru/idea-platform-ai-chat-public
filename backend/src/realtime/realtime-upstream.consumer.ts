import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { hostname } from 'node:os';

import {
  RedisService,
  type RedisStreamEntry,
} from '../core/redis/redis.service';
import { SendLiveChatMessagePayloadDto } from '../modules/live-chat/dto/send-live-chat-message.dto';
import { LiveChatService } from '../modules/live-chat/live-chat.service';
import { RealtimePublisherService } from './realtime-publisher.service';
import {
  EDGE_UPSTREAM_DLQ_STREAM,
  EDGE_UPSTREAM_MAXLEN,
  EDGE_UPSTREAM_STREAM,
  MONOLITH_CONSUMER_GROUP,
  REALTIME_NAMESPACES,
  ROOM_CONTROL_EVENTS,
  RealtimeTransport,
  UPSTREAM_EVENTS,
  UpstreamEnvelope,
} from './realtime.types';

const READ_COUNT = 50;
const BLOCK_MS = 2000;

@Injectable()
export class RealtimeUpstreamConsumer
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(RealtimeUpstreamConsumer.name);
  private readonly consumerName = `${hostname()}-${process.pid}`;
  private running = false;
  private loop?: Promise<void>;
  private resume?: () => void;

  constructor(
    private readonly redis: RedisService,
    private readonly publisher: RealtimePublisherService,
    private readonly liveChat: LiveChatService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const transport = this.config.get<string>('REALTIME_TRANSPORT');
    if (transport !== RealtimeTransport.Redis) {
      this.logger.log(
        'Upstream consumer dormant (REALTIME_TRANSPORT is not "redis")',
      );
      return;
    }

    await this.ensureGroup();
    this.running = true;
    this.loop = this.consume();
    this.logger.log(
      `Upstream consumer started (group=${MONOLITH_CONSUMER_GROUP} consumer=${this.consumerName})`,
    );
  }

  async onApplicationShutdown(): Promise<void> {
    this.running = false;
    this.resume?.();
    if (this.loop) {
      await this.loop.catch(() => undefined);
    }
  }

  private async consume(): Promise<void> {
    while (this.running) {
      if (!this.redis.isReady) {
        await this.waitForReady();
        continue;
      }

      let entries: RedisStreamEntry[];
      try {
        entries = await this.redis.readGroup(
          MONOLITH_CONSUMER_GROUP,
          this.consumerName,
          EDGE_UPSTREAM_STREAM,
          READ_COUNT,
          BLOCK_MS,
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message.toLowerCase() : '';
        if (msg.includes('nogroup')) {
          this.logger.warn('Upstream consumer group missing; recreating it');
          try {
            await this.ensureGroup();
          } catch (recreateError) {
            this.logger.error(
              'Failed to recreate upstream consumer group; backing off 1 s',
              recreateError as Error,
            );
            await new Promise<void>(r => setTimeout(r, 1_000));
          }
          continue;
        }
        const isTransient =
          msg.includes('connection is closed') ||
          msg.includes('econnreset') ||
          msg.includes('etimedout') ||
          msg.includes('stream timeout') ||
          msg.includes('socket closed unexpectedly');
        if (isTransient) {
          await new Promise<void>(r => setTimeout(r, 50));
        } else {
          this.logger.error(
            'XREADGROUP failed; backing off 1 s',
            error as Error,
          );
          await new Promise<void>(r => setTimeout(r, 1_000));
        }
        continue;
      }

      for (const entry of entries) {
        await this.handleEntry(entry.id, entry.fields);
      }
    }
  }

  private async ensureGroup(): Promise<void> {
    await this.redis.ensureConsumerGroup(
      EDGE_UPSTREAM_STREAM,
      MONOLITH_CONSUMER_GROUP,
      '0',
    );
  }

  private waitForReady(): Promise<void> {
    return new Promise<void>(resolve => {
      if (this.redis.isReady || !this.running) {
        resolve();
        return;
      }

      let settled = false;
      const settle = (unsubscribe: () => void): void => {
        if (settled) {
          return;
        }
        settled = true;
        this.resume = undefined;
        unsubscribe();
        resolve();
      };

      const unsubscribe = this.redis.onReady(() => settle(unsubscribe));
      this.resume = () => settle(unsubscribe);
    });
  }

  private async handleEntry(
    id: string,
    fields: Record<string, string>,
  ): Promise<void> {
    let envelope: UpstreamEnvelope;
    try {
      envelope = parseUpstreamEnvelope(fields.payload);
    } catch (error) {
      this.logger.warn(
        `Poison upstream message ${id} -> DLQ: ${String(error)}`,
      );
      await this.toDlq(fields.payload, error);
      await this.ack(id);
      return;
    }

    try {
      await this.dispatch(envelope);
    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.warn(
          `Rejected upstream "${envelope.event}" (${id}): ${error.message}`,
        );
        await this.toDlq(fields.payload, error);
        await this.ack(id);
        return;
      }
      this.logger.error(
        `Processing failed for ${id}; leaving pending`,
        error as Error,
      );
      return;
    }

    await this.ack(id);
  }

  private async dispatch(envelope: UpstreamEnvelope): Promise<void> {
    switch (envelope.event) {
      case UPSTREAM_EVENTS.ROOM_REQUEST_JOIN:
        await this.handleRoomRequestJoin(envelope);
        return;
      case UPSTREAM_EVENTS.MESSAGE_SEND:
        await this.handleMessageSend(envelope);
        return;
      default:
        this.logger.warn(`Ignoring unknown upstream event "${envelope.event}"`);
    }
  }

  private async handleRoomRequestJoin(
    envelope: UpstreamEnvelope,
  ): Promise<void> {
    const { userId, sid, clientMsgId } = envelope;
    const roomId = readRoomId(envelope.payload);
    if (!sid || !roomId) {
      throw new BadRequestException('room:request_join missing sid or roomId');
    }

    try {
      await this.liveChat.assertRoomAccess(roomId, userId);
    } catch (error) {
      if (!(error instanceof HttpException)) {
        throw error;
      }
      this.publisher.publishToSocket(
        { namespace: REALTIME_NAMESPACES.LIVE_CHAT, sid },
        ROOM_CONTROL_EVENTS.JOIN_DENIED,
        // ⚠️ DEBUG-ONLY: forward the enriched exception message to the client.
        // Restore the hardcoded 'Access denied' before production.
        { roomId, clientMsgId, reason: error.message },
      );
      return;
    }

    this.publisher.publishToSocket(
      { namespace: REALTIME_NAMESPACES.LIVE_CHAT, sid },
      ROOM_CONTROL_EVENTS.JOIN_APPROVED,
      { roomId, clientMsgId },
    );
  }

  private async handleMessageSend(envelope: UpstreamEnvelope): Promise<void> {
    const dto = plainToInstance(
      SendLiveChatMessagePayloadDto,
      envelope.payload,
    );
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException('Invalid message:send payload');
    }
    await this.liveChat.processInboundMessage(envelope.userId, dto);
  }

  private async ack(id: string): Promise<void> {
    await this.redis.ackMessages(
      EDGE_UPSTREAM_STREAM,
      MONOLITH_CONSUMER_GROUP,
      id,
    );
  }

  private async toDlq(
    payload: string | undefined,
    error: unknown,
  ): Promise<void> {
    await this.redis.xadd(
      EDGE_UPSTREAM_DLQ_STREAM,
      {
        payload: payload ?? '',
        error: error instanceof Error ? error.message : String(error),
      },
      EDGE_UPSTREAM_MAXLEN,
    );
  }
}

function parseUpstreamEnvelope(raw: string | undefined): UpstreamEnvelope {
  if (!raw) {
    throw new Error("stream entry missing 'payload' field");
  }
  const parsed = JSON.parse(raw) as Partial<UpstreamEnvelope>;
  if (typeof parsed.event !== 'string' || typeof parsed.userId !== 'string') {
    throw new Error(
      'invalid upstream envelope (event and userId are required)',
    );
  }
  return {
    v: typeof parsed.v === 'number' ? parsed.v : 1,
    event: parsed.event,
    userId: parsed.userId,
    sid: typeof parsed.sid === 'string' ? parsed.sid : undefined,
    clientMsgId:
      typeof parsed.clientMsgId === 'string' ? parsed.clientMsgId : '',
    payload: parsed.payload,
    meta: parsed.meta,
  };
}

function readRoomId(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object' && 'roomId' in payload) {
    const roomId = (payload as Record<string, unknown>).roomId;
    if (typeof roomId === 'string' && roomId.length > 0) {
      return roomId;
    }
  }
  return undefined;
}
