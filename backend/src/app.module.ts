import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { IdeaModule } from './idea/idea.module';
import { MailModule } from './mail/mail.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProblemModule } from './problem/problem.module';
import { SearchModule } from './search/search.module';
import { TokenModule } from './token/token.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.APP_ENV ?? 'development'}`,
    }),
    UserModule,
    IdeaModule,
    ProblemModule,
    PrismaModule,
    AuthModule,
    PasswordResetModule,
    TokenModule,
    MailModule,
    SearchModule,
  ],
})
export class AppModule {}
