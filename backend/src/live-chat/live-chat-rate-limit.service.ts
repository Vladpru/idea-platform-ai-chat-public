import {
  ForbiddenException,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import {
  LIVE_CHAT_MESSAGE_RATE_LIMIT,
  LIVE_CHAT_MESSAGE_RATE_WINDOW_MS,
  LIVE_CHAT_RATE_LIMIT_KEY_PREFIX,
} from './live-chat.constants';

@Injectable()
export class LiveChatRateLimitService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const redisUrl = this.config.getOrThrow<string>('REDIS_URL');
    this.client = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => this.client?.disconnect());
  }

  async assertRateLimit(userId: string): Promise<void> {
    const key = `${LIVE_CHAT_RATE_LIMIT_KEY_PREFIX}${userId}`;
    const count = await this.client.incr(key);

    if (count === 1) {
      await this.client.pexpire(key, LIVE_CHAT_MESSAGE_RATE_WINDOW_MS);
    }

    if (count > LIVE_CHAT_MESSAGE_RATE_LIMIT) {
      throw new ForbiddenException('Too many live chat messages. Please wait.');
    }
  }
}
