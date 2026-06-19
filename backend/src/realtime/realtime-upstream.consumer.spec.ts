import type { ConfigService } from '@nestjs/config';

import type { LiveChatService } from '../modules/live-chat/live-chat.service';
import type { RedisService, RedisStreamEntry } from '../core/redis/redis.service';
import type { RealtimePublisherService } from './realtime-publisher.service';
import { RealtimeUpstreamConsumer } from './realtime-upstream.consumer';

const tick = (): Promise<void> =>
  new Promise<void>(resolve => setImmediate(resolve));

class FakeRedis {
  private ready: boolean;
  private readonly readyListeners = new Set<() => void>();
  private readonly blockedReads: Array<(value: RedisStreamEntry[]) => void> =
    [];

  ensureConsumerGroup = jest.fn().mockResolvedValue(undefined);
  ackMessages = jest.fn().mockResolvedValue(1);
  xadd = jest.fn().mockResolvedValue(undefined);
  readGroup = jest.fn(
    () =>
      new Promise<RedisStreamEntry[]>(resolve => {
        this.blockedReads.push(resolve);
      }),
  );

  constructor(ready: boolean) {
    this.ready = ready;
  }

  get isReady(): boolean {
    return this.ready;
  }

  onReady(listener: () => void): () => void {
    this.readyListeners.add(listener);
    return () => {
      this.readyListeners.delete(listener);
    };
  }

  emitReady(): void {
    this.ready = true;
    for (const listener of [...this.readyListeners]) {
      listener();
    }
  }

  drop(): void {
    this.ready = false;
  }

  releaseReads(): void {
    const pending = this.blockedReads.splice(0);
    for (const resolve of pending) {
      resolve([]);
    }
  }
}

function buildConsumer(redis: FakeRedis): RealtimeUpstreamConsumer {
  const publisher = {
    publish: jest.fn(),
    publishToSocket: jest.fn(),
  } as unknown as RealtimePublisherService;
  const liveChat = {} as unknown as LiveChatService;
  const config = {
    get: jest.fn().mockReturnValue('redis'),
  } as unknown as ConfigService;

  return new RealtimeUpstreamConsumer(
    redis as unknown as RedisService,
    publisher,
    liveChat,
    config,
  );
}

describe('RealtimeUpstreamConsumer Redis backpressure', () => {
  it('does not read while disconnected and resumes when the client is ready', async () => {
    const redis = new FakeRedis(false);
    const consumer = buildConsumer(redis);

    await consumer.onApplicationBootstrap();
    await tick();
    expect(redis.readGroup).not.toHaveBeenCalled();

    redis.emitReady();
    await tick();
    expect(redis.readGroup).toHaveBeenCalledTimes(1);

    const shutdown = consumer.onApplicationShutdown();
    redis.releaseReads();
    await shutdown;
  });

  it('parks on a closed connection instead of spamming XREADGROUP', async () => {
    const redis = new FakeRedis(true);
    redis.readGroup.mockImplementationOnce(() => {
      redis.drop();
      return Promise.reject(new Error('Connection is closed.'));
    });

    const consumer = buildConsumer(redis);

    await consumer.onApplicationBootstrap();
    await tick();
    expect(redis.readGroup).toHaveBeenCalledTimes(1);

    await tick();
    expect(redis.readGroup).toHaveBeenCalledTimes(1);

    redis.emitReady();
    await tick();
    expect(redis.readGroup).toHaveBeenCalledTimes(2);

    const shutdown = consumer.onApplicationShutdown();
    redis.releaseReads();
    await shutdown;
  });

  it('recreates the consumer group and resumes when the group was evicted', async () => {
    const redis = new FakeRedis(true);
    redis.readGroup.mockImplementationOnce(() =>
      Promise.reject(new Error('NOGROUP No such key or consumer group')),
    );

    const consumer = buildConsumer(redis);

    await consumer.onApplicationBootstrap();
    await tick();

    expect(redis.ensureConsumerGroup).toHaveBeenCalledTimes(2);
    expect(redis.readGroup).toHaveBeenCalledTimes(2);

    const shutdown = consumer.onApplicationShutdown();
    redis.releaseReads();
    await shutdown;
  });
});
