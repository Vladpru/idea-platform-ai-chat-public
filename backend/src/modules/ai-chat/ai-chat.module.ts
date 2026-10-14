import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { RagModule } from '../rag/rag.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { IntentClassifierService } from './intent-classifier.service';
import { NudgeService } from './nudge.service';
import { UserContextService } from './user-context.service';

@Module({
  imports: [PrismaModule, AiModule, RagModule],
  controllers: [AiChatController],
  providers: [AiChatService, UserContextService, IntentClassifierService, NudgeService],
})
export class AiChatModule {}
