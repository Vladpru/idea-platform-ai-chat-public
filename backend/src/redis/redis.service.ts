import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.getOrThrow<string>('REDIS_URL'), {
      maxRetriesPerRequest: null,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Append an entry to a Redis stream. When `maxLen` is provided the stream is
   * capped with approximate trimming (`MAXLEN ~`) to keep memory bounded.
   */
  async xadd(
    stream: string,
    fields: Record<string, string>,
    maxLen?: number,
  ): Promise<void> {
    const entries = Object.entries(fields).flatMap(([key, value]) => [
      key,
      value,
    ]);
    const args: (string | number)[] =
      maxLen && maxLen > 0
        ? ['MAXLEN', '~', maxLen, '*', ...entries]
        : ['*', ...entries];

    await this.client.call('XADD', stream, ...args);
  }
}
