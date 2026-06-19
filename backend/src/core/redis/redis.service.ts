import { EventEmitter } from 'node:events';

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export interface RedisStreamEntry {
  id: string;
  fields: Record<string, string>;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private streamClient?: Redis;
  private ready = false;
  private streamReady = false;
  private readonly statusEmitter = new EventEmitter();

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.getOrThrow<string>('REDIS_URL'), {
      maxRetriesPerRequest: null,
      keepAlive: 5_000,
    });
    this.trackConnectionState(this.client);
  }

  get isReady(): boolean {
    return this.ready && this.streamReady;
  }

  onReady(listener: () => void): () => void {
    this.statusEmitter.on('ready', listener);
    return () => {
      this.statusEmitter.off('ready', listener);
    };
  }

  private trackConnectionState(client: Redis, isStream = false): void {
    const setReady = (value: boolean) => {
      if (isStream) {
        this.streamReady = value;
      } else {
        this.ready = value;
      }
      if (value) {
        this.statusEmitter.emit('ready');
      }
    };
    client.on('ready', () => setReady(true));
    client.on('reconnecting', () => setReady(false));
    client.on('close', () => setReady(false));
    client.on('end', () => setReady(false));
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
      this.trackConnectionState(this.streamClient, true);
    }
    return this.streamClient;
  }
}

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
