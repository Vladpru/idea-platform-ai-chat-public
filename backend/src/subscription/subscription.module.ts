import { Module, forwardRef } from '@nestjs/common';

import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { TokenModule } from '../token/token.module';
import { SubscriberNotificationService } from './subscriber-notification.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [PrismaModule, RedisModule, TokenModule, forwardRef(() => NotificationModule)],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriberNotificationService],
  exports: [SubscriptionService, SubscriberNotificationService],
})
export class SubscriptionModule {}
