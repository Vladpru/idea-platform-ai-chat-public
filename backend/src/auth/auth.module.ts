import { Module } from '@nestjs/common';

import { MailModule } from '../mail/mail.module';
import { TokenModule } from '../token/token.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [UserModule, TokenModule, MailModule],
})
export class AuthModule {}
