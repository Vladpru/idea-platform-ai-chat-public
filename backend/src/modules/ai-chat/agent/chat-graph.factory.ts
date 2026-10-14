import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { UserContextService } from '../user-context.service';
import { type ChatGraph, buildChatGraph } from './chat-graph';
import { isFlagEnabled } from './lib/env-flag';
import {
  LLM_PROVIDER,
  type LlmProvider,
  withModelFallbacks,
} from './llm/llm-provider.interface';
import { createAgentNode } from './nodes/agent.node';
import {
  classificationSchema,
  createClassifyNode,
} from './nodes/classify.node';
import {
  createFollowupsNode,
  createNoFollowupsNode,
  followupsSchema,
} from './nodes/followups.node';
import { createLoadContextNode } from './nodes/load-context.node';
import { ChatToolsProvider } from './tools/chat-tools.provider';

function bindToolsOrSelf(
  model: BaseChatModel,
  tools: StructuredToolInterface[],
): Runnable<BaseMessage[], BaseMessage> {
  if (tools.length === 0) return model;
  if (!model.bindTools) {
    throw new Error(`Model ${model.getName()} does not support tool calling`);
  }
  return model.bindTools(tools);
}

@Injectable()
export class ChatGraphFactory {
  readonly graph: ChatGraph;

  constructor(
    @Inject(LLM_PROVIDER) llm: LlmProvider,
    toolsProvider: ChatToolsProvider,
    prisma: PrismaService,
    userContext: UserContextService,
    config: ConfigService,
  ) {
    const agentModels = llm.createChatModels('agent', { temperature: 0.3 });
    const classifier = withModelFallbacks(
      llm.createChatModels('light', { temperature: 0 }),
      model =>
        model.withStructuredOutput(classificationSchema, {
          name: 'classify_intent',
        }),
    );
    const followupsNode = isFlagEnabled(
      config.get<string>('AI_CHAT_FOLLOWUPS_ENABLED'),
    )
      ? createFollowupsNode(
          withModelFallbacks(
            llm.createChatModels('light', { temperature: 0.5 }),
            model =>
              model.withStructuredOutput(followupsSchema, {
                name: 'followup_suggestions',
              }),
          ),
        )
      : createNoFollowupsNode();
    const tools = toolsProvider.tools;

    this.graph = buildChatGraph({
      loadContext: createLoadContextNode({ prisma, userContext }),
      classify: createClassifyNode(classifier),
      agent: createAgentNode({
        tools,
        createAgentRunnable: bound =>
          withModelFallbacks(agentModels, model =>
            bindToolsOrSelf(model, bound),
          ),
      }),
      followups: followupsNode,
      tools: Object.values(tools),
    });
  }
}
