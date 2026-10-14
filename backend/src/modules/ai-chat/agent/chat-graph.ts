import type { StructuredToolInterface } from '@langchain/core/tools';
import { END, START, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';

import { ChatState } from './chat-state';
import { routeAfterAgent } from './nodes/agent.node';
import type { ChatNode } from './nodes/load-context.node';

export function buildChatGraph(deps: {
  loadContext: ChatNode;
  classify: ChatNode;
  agent: ChatNode;
  followups: ChatNode;
  tools: StructuredToolInterface[];
}) {
  return new StateGraph(ChatState)
    .addNode('load_context', deps.loadContext)
    .addNode('classify', deps.classify)
    .addNode('agent', deps.agent)
    .addNode('tools', new ToolNode(deps.tools))
    .addNode('followups', deps.followups)
    .addEdge(START, 'load_context')
    .addEdge('load_context', 'classify')
    .addEdge('classify', 'agent')
    .addConditionalEdges('agent', routeAfterAgent, ['tools', 'followups'])
    .addEdge('tools', 'agent')
    .addEdge('followups', END)
    .compile();
}

export type ChatGraph = ReturnType<typeof buildChatGraph>;
