import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { AnalyticsModule } from './core/analytics/analytics.module';
import { AiImageModule } from './modules/ai-image/ai-image.module';
import { AiSummaryModule } from './modules/ai-summary/ai-summary.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentModule } from './modules/comment/comment.module';
import { ConferenceModule } from './modules/conference/conference.module';
import { IdeaModule } from './modules/idea/idea.module';
import { LiveChatModule } from './modules/live-chat/live-chat.module';
import { MailModule } from './core/mail/mail.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { PasswordResetModule } from './modules/password-reset/password-reset.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { ProblemModule } from './modules/problem/problem.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RedisModule } from './core/redis/redis.module';
import { SearchModule } from './modules/search/search.module';
import { SimilarityModule } from './modules/similarity/similarity.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { TagModule } from './modules/tag/tag.module';
import { TokenModule } from './modules/token/token.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    SentryModule.forRoot(),
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
    RealtimeModule,
    AnalyticsModule,
    SubscriptionModule,
    UserModule,
    AiModule,
    AiSummaryModule,
    AiImageModule,
    IdeaModule,
    ConferenceModule,
    ProblemModule,
    CommentModule,
    LiveChatModule,
    PrismaModule,
    AuthModule,
    PasswordResetModule,
    TokenModule,
    MailModule,
    NotificationModule,
    PdfModule,
    SearchModule,
    SimilarityModule,
    StatisticsModule,
    AchievementModule,
    TagModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
