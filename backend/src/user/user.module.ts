import { Module } from '@nestjs/common';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TokenModule } from '../token/token.module';
import { UserContributionsService } from './user-contributions.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserContributionsService],
  imports: [PrismaModule, TokenModule, CloudinaryModule, SubscriptionModule],
  exports: [UserService],
})
export class UserModule {}
