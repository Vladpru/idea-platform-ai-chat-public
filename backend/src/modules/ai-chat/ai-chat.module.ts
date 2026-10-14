import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { EntityVisibilityModule } from '../entity-visibility/entity-visibility.module';
import { RagModule } from '../rag/rag.module';
import { ChatGraphFactory } from './agent/chat-graph.factory';
import { createLlmProvider } from './agent/llm/create-llm-provider';
import { LLM_PROVIDER } from './agent/llm/llm-provider.interface';
import { SummaryService } from './agent/summary.service';
import { ChatToolsProvider } from './agent/tools/chat-tools.provider';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { NudgeService } from './nudge.service';
import { UserContextService } from './user-context.service';

@Module({
  imports: [PrismaModule, RagModule, EntityVisibilityModule],
  controllers: [AiChatController],
  providers: [
    AiChatService,
    UserContextService,
    NudgeService,
    ChatToolsProvider,
    ChatGraphFactory,
    SummaryService,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: createLlmProvider,
    },
  ],
})
export class AiChatModule {}
