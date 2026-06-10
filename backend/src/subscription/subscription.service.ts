import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const SUBSCRIBER_COUNT_TTL = 24 * 60 * 60;

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

  async getSubscriberCount(userId: string): Promise<number> {
    const cacheKey = this.subscriberCountKey(userId);
    const cached = await this.redis.get(cacheKey);

    if (cached !== null) {
      const parsed = Number.parseInt(cached, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    const existingFetch = this.pendingFetches.get(userId);
    if (existingFetch) {
      return existingFetch;
    }

    const dbFetchPromise = this.prisma.subscription
      .count({
        where: { followingId: userId },
      })
      .then(async count => {
        await this.redis.set(cacheKey, String(count), SUBSCRIBER_COUNT_TTL);
        this.pendingFetches.delete(userId);
        return count;
      })
      .catch(error => {
        this.pendingFetches.delete(userId);
        throw error;
      });

    this.pendingFetches.set(userId, dbFetchPromise);
    return dbFetchPromise;
  }

  private subscriberCountKey(userId: string): string {
    return `user:${userId}:subscribers_count`;
  }
}
