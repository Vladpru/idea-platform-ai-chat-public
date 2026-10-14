import { type BaseMessage, SystemMessage } from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';
import type { StructuredToolInterface } from '@langchain/core/tools';

import { type ChatStateType, MAX_TOOL_ROUNDS } from '../chat-state';
import { getRunContext } from '../chat.types';
import { toolCallCount } from '../lib/messages';
import { buildSystemPrompt } from '../prompts/system.prompt';
import { type ChatTools, selectToolNames, selectTools } from '../tool-registry';
import type { ChatNode } from './load-context.node';

export type AgentRunnableFactory = (
  tools: StructuredToolInterface[],
) => Runnable<BaseMessage[], BaseMessage>;

export function createAgentNode(deps: {
  tools: ChatTools;
  createAgentRunnable: AgentRunnableFactory;
}): ChatNode {
  return async (state, config) => {
    const context = getRunContext(config);
    const toolsAvailable = state.toolRounds < MAX_TOOL_ROUNDS;
    const tools = toolsAvailable
      ? selectTools(
          deps.tools,
          selectToolNames(state.intent, context.pageContext),
        )
      : [];
    const system = new SystemMessage(
      buildSystemPrompt({
        intent: state.intent,
        userContext: state.userContext,
        summary: state.summary,
        pageContext: context.pageContext,
        toolsAvailable,
        referencedItems: state.referencedItems,
      }),
    );

    const response = await deps
      .createAgentRunnable(tools)
      .invoke([system, ...state.messages], config);

    return {
      messages: [response],
      toolRounds:
        toolCallCount(response) > 0 ? state.toolRounds + 1 : state.toolRounds,
    };
  };
}

export function routeAfterAgent(state: ChatStateType): 'tools' | 'followups' {
  const last = state.messages.at(-1);
  return toolCallCount(last) > 0 && state.toolRounds <= MAX_TOOL_ROUNDS
    ? 'tools'
    : 'followups';
}
