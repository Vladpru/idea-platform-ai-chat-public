import type { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import { RedisService } from './redis.service';

jest.mock('ioredis', () => {
  type Listener = () => void;

  class MockRedis {
    static instances: MockRedis[] = [];
    private readonly listeners = new Map<string, Listener[]>();
    readonly url?: string;
    readonly options?: unknown;

    constructor(url?: string, options?: unknown) {
      this.url = url;
      this.options = options;
      MockRedis.instances.push(this);
    }

    on(event: string, listener: Listener): this {
      const current = this.listeners.get(event) ?? [];
      current.push(listener);
      this.listeners.set(event, current);
      return this;
    }

    emit(event: string): void {
      for (const listener of this.listeners.get(event) ?? []) {
        listener();
      }
    }

    call(): Promise<unknown> {
      return Promise.resolve(null);
    }

    duplicate(): MockRedis {
      return new MockRedis(this.url, this.options);
    }

    quit(): Promise<string> {
      return Promise.resolve('OK');
    }
  }

  return { Redis: MockRedis };
});

type MockRedisClient = { emit(event: string): void };
type MockRedisStatic = { instances: MockRedisClient[] };

function resetInstances(): void {
  (Redis as unknown as MockRedisStatic).instances = [];
}

function clientAt(index: number): MockRedisClient {
  return (Redis as unknown as MockRedisStatic).instances[index];
}

describe('RedisService connection state', () => {
  const config = {
    getOrThrow: () => 'redis://localhost:6379',
  } as unknown as ConfigService;

  beforeEach(() => {
    resetInstances();
  });

  it('is ready once the main client is ready without waiting for the stream connection', () => {
    const service = new RedisService(config);
    expect(service.isReady).toBe(false);

    clientAt(0).emit('ready');
    expect(service.isReady).toBe(true);
  });

  it('drops readiness when either connection is lost', async () => {
    const service = new RedisService(config);
    clientAt(0).emit('ready');
    await service.ensureConsumerGroup('edge:upstream', 'monolith');
    clientAt(1).emit('ready');
    expect(service.isReady).toBe(true);

    clientAt(0).emit('close');
    expect(service.isReady).toBe(false);

    clientAt(0).emit('ready');
    expect(service.isReady).toBe(true);

    clientAt(1).emit('reconnecting');
    expect(service.isReady).toBe(false);
  });

  it('notifies onReady subscribers and stops after unsubscribe', () => {
    const service = new RedisService(config);
    const listener = jest.fn();

    const unsubscribe = service.onReady(listener);
    clientAt(0).emit('ready');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    clientAt(0).emit('close');
    clientAt(0).emit('ready');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
