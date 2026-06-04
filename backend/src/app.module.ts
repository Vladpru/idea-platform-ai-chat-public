import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AiImageModule } from './ai-image/ai-image.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { IdeaModule } from './idea/idea.module';
import { MailModule } from './mail/mail.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProblemModule } from './problem/problem.module';
import { SearchModule } from './search/search.module';
import { SimilarityModule } from './similarity/similarity.module';
import { StatisticsModule } from './statistics/statistics.module';
import { TagModule } from './tag/tag.module';
import { TokenModule } from './token/token.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.APP_ENV ?? 'development'}`,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 30,
      },
    ]),
    UserModule,
    AiModule,
    AiImageModule,
    IdeaModule,
    ProblemModule,
    CommentModule,
    PrismaModule,
    AuthModule,
    PasswordResetModule,
    TokenModule,
    MailModule,
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
