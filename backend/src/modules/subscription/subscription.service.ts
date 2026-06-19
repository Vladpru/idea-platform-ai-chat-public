import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { shouldUseSubscriberCountCache } from '../../shared/context/request-context';

const SUBSCRIBER_COUNT_TTL = 24 * 60 * 60;

type GetSubscriberCountOptions = {
  useCache?: boolean;
};

@Injectable()
export class SubscriptionService {
  private readonly pendingFetches = new Map<string, Promise<number>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async subscribe(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot subscribe to yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.prisma.subscription.create({
        data: {
          followerId,
          followingId,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Already subscribed to this user');
      }
      throw error;
    }

    const cacheKey = this.subscriberCountKey(followingId);
    await this.redis.del(cacheKey);
  }

  async unsubscribe(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot unsubscribe from yourself');
    }

    try {
      await this.prisma.subscription.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Subscription not found');
      }
      throw error;
    }

    const cacheKey = this.subscriberCountKey(followingId);
    await this.redis.del(cacheKey);
  }

  async isSubscribed(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    const row = await this.prisma.subscription.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      select: { id: true },
    });

    return row !== null;
  }

  async getSubscriberCount(
    userId: string,
    options?: GetSubscriberCountOptions,
  ): Promise<number> {
    const useCache =
      options?.useCache ?? shouldUseSubscriberCountCache();

    if (useCache) {
      const cacheKey = this.subscriberCountKey(userId);

      try {
        const cached = await this.redis.get(cacheKey);

        if (cached !== null) {
          const parsed = Number.parseInt(cached, 10);
          if (!Number.isNaN(parsed)) {
            return parsed;
          }
        }
      } catch {
        return this.countSubscribersFromDatabase(userId);
      }

      const existingFetch = this.pendingFetches.get(userId);
      if (existingFetch) {
        return existingFetch;
      }

      const dbFetchPromise = this.countSubscribersFromDatabase(userId)
        .then(async count => {
          try {
            await this.redis.set(
              cacheKey,
              String(count),
              SUBSCRIBER_COUNT_TTL,
            );
          } catch {
            return count;
          } finally {
            this.pendingFetches.delete(userId);
          }
          return count;
        })
        .catch(error => {
          this.pendingFetches.delete(userId);
          throw error;
        });

      this.pendingFetches.set(userId, dbFetchPromise);
      return dbFetchPromise;
    }

    return this.countSubscribersFromDatabase(userId);
  }

  private async countSubscribersFromDatabase(userId: string): Promise<number> {
    return this.prisma.subscription.count({
      where: { followingId: userId },
    });
  }

  private subscriberCountKey(userId: string): string {
    return `user:${userId}:subscribers_count`;
  }
}
