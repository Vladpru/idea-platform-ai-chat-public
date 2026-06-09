import { Module } from '@nestjs/common';

import { EntityVisibilityModule } from '../entity-visibility/entity-visibility.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { LiveChatController } from './live-chat.controller';
import { LiveChatGateway } from './live-chat.gateway';
import { LiveChatRepository } from './live-chat.repository';
import { LiveChatService } from './live-chat.service';

@Module({
  imports: [PrismaModule, EntityVisibilityModule, TokenModule],
  controllers: [LiveChatController],
  providers: [LiveChatRepository, LiveChatService, LiveChatGateway],
  exports: [LiveChatService],
})
export class LiveChatModule {}
