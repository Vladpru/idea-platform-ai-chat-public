import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server, type ServerOptions } from 'socket.io';

type RedisAdapterFactory = ReturnType<typeof createAdapter>;

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor!: RedisAdapterFactory;
  private pubClient!: Redis;
  private subClient!: Redis;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(redisUrl: string): Promise<void> {
    const trimmedUrl = redisUrl.trim();
    if (!trimmedUrl) {
      throw new Error('REDIS_URL is required but was not configured');
    }

    const pubClient = new Redis(trimmedUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    const subClient = pubClient.duplicate();

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
    } catch (error) {
      await this.disconnectClients(pubClient, subClient);
      if (error instanceof Error) {
        throw new Error(
          `Failed to connect to Redis at REDIS_URL: ${error.message}`,
          {
            cause: error,
          },
        );
      }
      throw error;
    }

    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.pubClient = pubClient;
    this.subClient = subClient;
    this.logger.log('Redis WebSocket adapter connected');
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(this.adapterConstructor);
    return server;
  }

  async close(): Promise<void> {
    await this.disconnectClients(this.pubClient, this.subClient);
  }

  private async disconnectClients(
    pubClient: Redis | null | undefined,
    subClient: Redis | null | undefined,
  ): Promise<void> {
    const tasks: Promise<unknown>[] = [];
    if (pubClient) {
      tasks.push(pubClient.quit().catch(() => pubClient.disconnect()));
    }
    if (subClient) {
      tasks.push(subClient.quit().catch(() => subClient.disconnect()));
    }
    await Promise.all(tasks);
  }
}
