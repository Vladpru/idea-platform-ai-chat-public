import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { RunnableLambda } from '@langchain/core/runnables';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import { buildChatGraph } from './chat-graph';
import { MAX_TOOL_ROUNDS } from './chat-state';
import { getRunContext } from './chat.types';
import { createAgentNode } from './nodes/agent.node';
import { createClassifyNode } from './nodes/classify.node';
import { createFollowupsNode } from './nodes/followups.node';
import type { ChatNode } from './nodes/load-context.node';
import { CHAT_TOOL_NAMES, type ChatTools } from './tool-registry';
import { createTestContext } from './tools/test-context';

function fakeTools(): ChatTools {
  const entries = CHAT_TOOL_NAMES.map(name => [
    name,
    tool(
      (_input, config) => {
        if (name === 'propose_draft') {
          getRunContext(config).emit({
            type: 'draft_proposal',
            draftType: 'idea',
            title: 'T',
            description: 'D',
            tags: [],
          });
        }
        return JSON.stringify({ ok: name });
      },
      {
        name,
        description: name,
        schema: z.object({ query: z.string().optional() }),
      },
    ),
  ]);
  return Object.fromEntries(entries) as ChatTools;
}

const loadContext: ChatNode = state =>
  Promise.resolve({ messages: [new HumanMessage(state.question)] });

function graphWith(
  intent: string,
  script: (tools: string[], call: number) => AIMessage,
) {
  const tools = fakeTools();
  const calls: string[][] = [];
  const graph = buildChatGraph({
    loadContext,
    classify: createClassifyNode(
      RunnableLambda.from(() => ({ intent, entityHint: null })),
    ),
    agent: createAgentNode({
      tools,
      createAgentRunnable: bound =>
        RunnableLambda.from(() => {
          const names = bound.map(t => t.name);
          calls.push(names);
          return script(names, calls.length);
        }),
    }),
    followups: createFollowupsNode(
      RunnableLambda.from(() => ({ suggestions: ['next?'] })),
    ),
    tools: Object.values(tools),
  });
  return { graph, calls };
}

describe('chat graph', () => {
  it('runs classify → agent → tools → agent → followups', async () => {
    const { graph, calls } = graphWith('search', (_tools, call) =>
      call === 1
        ? new AIMessage({
            content: '',
            tool_calls: [
              { id: 'c1', name: 'search_ideas_problems', args: { query: 'x' } },
            ],
          })
        : new AIMessage('Found 2 ideas'),
    );
    const { config, events } = createTestContext();

    const final = await graph.invoke({ question: 'find x' }, config);

    expect(events[0]).toEqual({
      type: 'intent',
      intent: 'search',
      entityHint: null,
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain('search_ideas_problems');
    expect(calls[0]).not.toContain('propose_draft');
    expect(final.messages.at(-1)?.content).toBe('Found 2 ideas');
    expect(final.toolRounds).toBe(1);
    expect(final.suggestions).toEqual(['next?']);
  });

  it('caps tool rounds and forces a final answer without tools', async () => {
    const { graph, calls } = graphWith('search', tools =>
      tools.length > 0
        ? new AIMessage({
            content: '',
            tool_calls: [
              {
                id: `c${Math.random()}`,
                name: 'search_knowledge',
                args: { query: 'x' },
              },
            ],
          })
        : new AIMessage('best effort answer'),
    );
    const { config } = createTestContext();

    const final = await graph.invoke({ question: 'loop' }, config);

    expect(calls).toHaveLength(MAX_TOOL_ROUNDS + 1);
    expect(calls.at(-1)).toEqual([]);
    expect(final.toolRounds).toBe(MAX_TOOL_ROUNDS);
    expect(final.messages.at(-1)?.content).toBe('best effort answer');
  });

  it('emits draft_proposal after intent for create_idea', async () => {
    const { graph } = graphWith('create_idea', (_tools, call) =>
      call === 1
        ? new AIMessage({
            content: '',
            tool_calls: [{ id: 'd1', name: 'propose_draft', args: {} }],
          })
        : new AIMessage('Here is your draft'),
    );
    const { config, events } = createTestContext();

    await graph.invoke({ question: 'create an idea about parking' }, config);

    expect(events.map(e => e.type)).toEqual(['intent', 'draft_proposal']);
  });
});
