import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/** A single entry read from a Redis stream. */
export interface RedisStreamEntry {
  id: string;
  fields: Record<string, string>;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  // Dedicated connection for blocking stream reads. A blocking XREADGROUP holds
  // its connection for the whole BLOCK duration, so it must never share the
  // main client or it would stall every other Redis op in the app.
  private streamClient?: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.getOrThrow<string>('REDIS_URL'), {
      maxRetriesPerRequest: null,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    if (this.streamClient) {
      await this.streamClient.quit();
    }
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

  /**
   * Create a stream consumer group (idempotent), creating the stream itself
   * with MKSTREAM if it does not yet exist. `startId` defaults to `0` so a
   * freshly created group consumes any messages already buffered in the stream.
   */
  async ensureConsumerGroup(
    stream: string,
    group: string,
    startId = '0',
  ): Promise<void> {
    try {
      await this.streamConnection().call(
        'XGROUP',
        'CREATE',
        stream,
        group,
        startId,
        'MKSTREAM',
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('BUSYGROUP')) {
        return;
      }
      throw error;
    }
  }

  /**
   * Blocking XREADGROUP for new (`>`) messages, on the dedicated connection.
   * Returns an empty array on timeout.
   */
  async readGroup(
    group: string,
    consumer: string,
    stream: string,
    count: number,
    blockMs: number,
  ): Promise<RedisStreamEntry[]> {
    const reply = await this.streamConnection().call(
      'XREADGROUP',
      'GROUP',
      group,
      consumer,
      'COUNT',
      count,
      'BLOCK',
      blockMs,
      'STREAMS',
      stream,
      '>',
    );
    return parseStreamReply(reply);
  }

  /** Acknowledge one or more processed stream entries. */
  async ackMessages(
    stream: string,
    group: string,
    ...ids: string[]
  ): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const acked = await this.client.call('XACK', stream, group, ...ids);
    return typeof acked === 'number' ? acked : Number(acked ?? 0);
  }

  private streamConnection(): Redis {
    if (!this.streamClient) {
      this.streamClient = this.client.duplicate();
    }
    return this.streamClient;
  }
}

/** Parse an ioredis XREADGROUP reply ([[stream, [[id, [f, v, ...]], ...]]]). */
function parseStreamReply(reply: unknown): RedisStreamEntry[] {
  if (!Array.isArray(reply)) {
    return [];
  }

  const entries: RedisStreamEntry[] = [];
  for (const stream of reply) {
    const messages = Array.isArray(stream) ? stream[1] : undefined;
    if (!Array.isArray(messages)) {
      continue;
    }
    for (const message of messages) {
      if (!Array.isArray(message)) {
        continue;
      }
      const [id, flat] = message as [unknown, unknown];
      if (typeof id !== 'string' || !Array.isArray(flat)) {
        continue;
      }
      const fields: Record<string, string> = {};
      for (let i = 0; i + 1 < flat.length; i += 2) {
        fields[String(flat[i])] = String(flat[i + 1]);
      }
      entries.push({ id, fields });
    }
  }
  return entries;
}
