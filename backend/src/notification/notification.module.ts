import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SimilarityModule } from '../similarity/similarity.module';
import { TokenModule } from '../token/token.module';
import {
  NOTIFICATION_EMAIL_JOB_OPTIONS,
  NOTIFICATION_EMAIL_QUEUE,
} from './constants/notification-queue.constants';
import { FollowUpCronService } from './follow-up-cron.service';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationEmailProcessor } from './notification-email.processor';
import { NotificationSimilarityListener } from './notification-similarity.listener';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { NotificationListener } from './notification.listener';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    PrismaModule,
    TokenModule,
    MailModule,
    SimilarityModule,
    BullModule.registerQueue({
      name: NOTIFICATION_EMAIL_QUEUE,
      defaultJobOptions: NOTIFICATION_EMAIL_JOB_OPTIONS,
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationDispatchService,
    NotificationListener,
    NotificationSimilarityListener,
    NotificationEmailProcessor,
    NotificationGateway,
    FollowUpCronService,
  ],
  exports: [
    NotificationService,
    NotificationDispatchService,
    NotificationGateway,
  ],
})
export class NotificationModule {}
