import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AiImageModule } from './ai-image/ai-image.module';
import { AiSummaryModule } from './ai-summary/ai-summary.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { IdeaConferenceModule } from './idea-conference/idea-conference.module';
import { IdeaModule } from './idea/idea.module';
import { LiveChatModule } from './live-chat/live-chat.module';
import { MailModule } from './mail/mail.module';
import { NotificationModule } from './notification/notification.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProblemModule } from './problem/problem.module';
import { RedisModule } from './redis/redis.module';
import { SearchModule } from './search/search.module';
import { SimilarityModule } from './similarity/similarity.module';
import { StatisticsModule } from './statistics/statistics.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TagModule } from './tag/tag.module';
import { TokenModule } from './token/token.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.APP_ENV ?? 'development'}`,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URL'),
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 30,
      },
    ]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    RedisModule,
    SubscriptionModule,
    UserModule,
    AiModule,
    AiSummaryModule,
    AiImageModule,
    IdeaModule,
    IdeaConferenceModule,
    ProblemModule,
    CommentModule,
    LiveChatModule,
    PrismaModule,
    AuthModule,
    PasswordResetModule,
    TokenModule,
    MailModule,
    NotificationModule,
    SearchModule,
    SimilarityModule,
    StatisticsModule,
    TagModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
