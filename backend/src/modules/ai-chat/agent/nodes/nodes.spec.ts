import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { RunnableLambda } from '@langchain/core/runnables';

import type { PrismaService } from '../../../../core/prisma/prisma.service';
import { ChatState, type ChatStateType, MAX_TOOL_ROUNDS } from '../chat-state';
import { messageText } from '../lib/messages';
import type { ChatTools } from '../tool-registry';
import { createTestContext } from '../tools/test-context';
import { createAgentNode, routeAfterAgent } from './agent.node';
import { createClassifyNode } from './classify.node';
import { createFollowupsNode, createNoFollowupsNode } from './followups.node';
import { createLoadContextNode, referencedItems } from './load-context.node';

function state(overrides: Partial<ChatStateType> = {}): ChatStateType {
  return {
    messages: [],
    question: 'hi',
    userContext: null,
    summary: null,
    intent: 'general',
    entityHint: null,
    toolRounds: 0,
    suggestions: [],
    referencedItems: [],
    ...overrides,
  };
}

const fakeTool = (name: string) =>
  ({ name }) as unknown as ChatTools[keyof ChatTools];
const allTools = Object.fromEntries(
  [
    'search_knowledge',
    'search_ideas_problems',
    'get_my_items',
    'get_entity',
    'propose_draft',
    'suggest_tags',
    'suggest_linked_problems',
  ].map(name => [name, fakeTool(name)]),
) as ChatTools;

describe('load_context node', () => {
  it('loads summary, last messages in chronological order, and appends the question', async () => {
    const prisma = {
      chatSession: {
        findUnique: jest.fn().mockResolvedValue({ summary: 'Earlier stuff' }),
      },
      chatMessage: {
        findMany: jest.fn().mockResolvedValue([
          {
            role: 'assistant',
            content: 'Here are 2 ideas',
            sources: [
              { type: 'idea', id: 'i1', title: 'Parking', relevance: 1 },
            ],
          },
          { role: 'user', content: 'find parking ideas', sources: [] },
        ]),
      },
    };
    const userContext = {
      getContext: jest.fn().mockResolvedValue({
        name: 'Ann',
        role: 'MEMBER',
        memberSinceDays: 1,
        contributionScore: 0,
      }),
    };
    const node = createLoadContextNode({
      prisma: prisma as unknown as PrismaService,
      userContext: userContext,
    });
    const { config } = createTestContext({ sessionId: 's-1', userId: 'u-1' });

    const update = await node(
      state({ question: 'tell me more about it' }),
      config,
    );

    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith({
      where: { sessionId: 's-1' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { role: true, content: true, sources: true },
    });
    expect(update.summary).toBe('Earlier stuff');
    expect(update.userContext).toMatchObject({ name: 'Ann' });
    const messages = update.messages as BaseMessage[];
    expect(messages.map(m => m._getType())).toEqual(['human', 'ai', 'human']);
    expect(messages[1].content).toBe('Here are 2 ideas');
    expect(messages[2].content).toBe('tell me more about it');
    expect(update.referencedItems).toEqual([
      { type: 'idea', id: 'i1', title: 'Parking' },
    ]);
  });

  it('takes referenced items from the newest assistant message that has any', async () => {
    const prisma = {
      chatSession: { findUnique: jest.fn().mockResolvedValue(null) },
      chatMessage: {
        findMany: jest.fn().mockResolvedValue([
          { role: 'assistant', content: 'You are welcome', sources: [] },
          { role: 'user', content: 'thanks', sources: [] },
          {
            role: 'assistant',
            content: 'Two matches',
            sources: [
              { type: 'idea', id: 'i1', title: 'First', relevance: 1 },
              { type: 'problem', id: 'p1', title: 'Second', relevance: 1 },
              { type: 'knowledge', title: 'faq.md', relevance: 1 },
            ],
          },
          {
            role: 'assistant',
            content: 'Older',
            sources: [{ type: 'idea', id: 'old', title: 'Old', relevance: 1 }],
          },
        ]),
      },
    };
    const node = createLoadContextNode({
      prisma: prisma as unknown as PrismaService,
      userContext: { getContext: jest.fn().mockResolvedValue(null) },
    });
    const { config } = createTestContext();

    const update = await node(state({ question: 'the first one' }), config);

    expect(update.referencedItems).toEqual([
      { type: 'idea', id: 'i1', title: 'First' },
      { type: 'problem', id: 'p1', title: 'Second' },
    ]);
  });

  it('drops the oldest history when it exceeds the character budget', async () => {
    const big = 'x'.repeat(5000);
    const prisma = {
      chatSession: { findUnique: jest.fn().mockResolvedValue(null) },
      chatMessage: {
        findMany: jest.fn().mockResolvedValue([
          { role: 'assistant', content: big, sources: [] },
          { role: 'user', content: big, sources: [] },
        ]),
      },
    };
    const node = createLoadContextNode({
      prisma: prisma as unknown as PrismaService,
      userContext: { getContext: jest.fn().mockResolvedValue(null) },
    });
    const { config } = createTestContext();

    const update = await node(state({ question: 'q' }), config);

    expect((update.messages as BaseMessage[]).map(m => m._getType())).toEqual([
      'ai',
      'human',
    ]);
  });

  it('keeps the earlier list when the newest answer only covered a single item', async () => {
    const list = [
      { type: 'idea', id: 'i1', title: 'First', relevance: 1 },
      { type: 'idea', id: 'i2', title: 'Second', relevance: 1 },
      { type: 'idea', id: 'i3', title: 'Third', relevance: 1 },
    ];
    const prisma = {
      chatSession: { findUnique: jest.fn().mockResolvedValue(null) },
      chatMessage: {
        findMany: jest.fn().mockResolvedValue([
          {
            role: 'assistant',
            content: 'Details of the first',
            sources: [list[0]],
          },
          {
            role: 'user',
            content: 'tell me more about the first one',
            sources: [],
          },
          { role: 'assistant', content: 'Three ideas', sources: list },
          { role: 'user', content: 'list ideas', sources: [] },
        ]),
      },
    };
    const node = createLoadContextNode({
      prisma: prisma as unknown as PrismaService,
      userContext: { getContext: jest.fn().mockResolvedValue(null) },
    });
    const { config } = createTestContext();

    const update = await node(
      state({ question: 'and the second one?' }),
      config,
    );

    expect(update.referencedItems).toEqual([
      { type: 'idea', id: 'i1', title: 'First' },
      { type: 'idea', id: 'i2', title: 'Second' },
      { type: 'idea', id: 'i3', title: 'Third' },
    ]);
  });

  it('falls back to a single-item answer when no list exists', async () => {
    const prisma = {
      chatSession: { findUnique: jest.fn().mockResolvedValue(null) },
      chatMessage: {
        findMany: jest.fn().mockResolvedValue([
          {
            role: 'assistant',
            content: 'Details',
            sources: [{ type: 'idea', id: 'i1', title: 'Only', relevance: 1 }],
          },
        ]),
      },
    };
    const node = createLoadContextNode({
      prisma: prisma as unknown as PrismaService,
      userContext: { getContext: jest.fn().mockResolvedValue(null) },
    });
    const { config } = createTestContext();

    const update = await node(state({ question: 'it' }), config);

    expect(update.referencedItems).toEqual([
      { type: 'idea', id: 'i1', title: 'Only' },
    ]);
  });

  it('referencedItems ignores knowledge sources and malformed values', () => {
    expect(
      referencedItems([{ type: 'knowledge', title: 'faq.md', relevance: 1 }]),
    ).toEqual([]);
    expect(referencedItems('nope')).toEqual([]);
    expect(
      referencedItems([
        { type: 'problem', id: 'p1', title: 'Traffic', relevance: 1 },
        { type: 'idea', title: 'no id' },
      ]),
    ).toEqual([{ type: 'problem', id: 'p1', title: 'Traffic' }]);
  });
});

describe('classify node', () => {
  it('emits and stores a valid classification', async () => {
    const classifier = RunnableLambda.from(() => ({
      intent: 'search',
      entityHint: 'parking',
    }));
    const { config, events } = createTestContext();

    const update = await createClassifyNode(classifier)(
      state({ question: 'list parking ideas' }),
      config,
    );

    expect(update).toEqual({ intent: 'search', entityHint: 'parking' });
    expect(events).toEqual([
      { type: 'intent', intent: 'search', entityHint: 'parking' },
    ]);
  });

  it('falls back to general on invalid output', async () => {
    const classifier = RunnableLambda.from(() => ({
      intent: 'dance',
      entityHint: 3,
    }));
    const { config, events } = createTestContext();

    const update = await createClassifyNode(classifier)(state(), config);

    expect(update).toEqual({ intent: 'general', entityHint: null });
    expect(events).toEqual([
      { type: 'intent', intent: 'general', entityHint: null },
    ]);
  });

  it('falls back to general when the model throws', async () => {
    const classifier = RunnableLambda.from((): unknown => {
      throw new Error('quota');
    });
    const { config } = createTestContext();

    await expect(
      createClassifyNode(classifier)(state(), config),
    ).resolves.toEqual({
      intent: 'general',
      entityHint: null,
    });
  });
});

describe('agent node', () => {
  it('binds only the tools for the intent and prepends the system prompt', async () => {
    const seen: { tools: string[]; messages: BaseMessage[] }[] = [];
    const node = createAgentNode({
      tools: allTools,
      createAgentRunnable: tools =>
        RunnableLambda.from((messages: BaseMessage[]) => {
          seen.push({ tools: tools.map(t => t.name), messages });
          return new AIMessage({
            content: '',
            tool_calls: [
              { id: 'c1', name: 'search_ideas_problems', args: { query: 'x' } },
            ],
          });
        }),
    });
    const { config } = createTestContext();

    const update = await node(
      state({ intent: 'search', messages: [new HumanMessage('find x')] }),
      config,
    );

    expect(seen[0].tools).toEqual([
      'search_ideas_problems',
      'search_knowledge',
      'get_entity',
    ]);
    expect(seen[0].messages[0]).toBeInstanceOf(SystemMessage);
    expect(update.toolRounds).toBe(1);
  });

  it('puts items from the previous answer into the system prompt', async () => {
    const seen: BaseMessage[][] = [];
    const node = createAgentNode({
      tools: allTools,
      createAgentRunnable: () =>
        RunnableLambda.from((messages: BaseMessage[]) => {
          seen.push(messages);
          return new AIMessage('ok');
        }),
    });
    const { config } = createTestContext();

    await node(
      state({
        intent: 'explain',
        referencedItems: [{ type: 'idea', id: 'i1', title: 'Parking' }],
      }),
      config,
    );

    const system = messageText(seen[0][0].content);
    expect(system).toContain('1. idea i1 "Parking"');
  });

  it('calls the model without tools once the round budget is used up', async () => {
    const seenTools: number[] = [];
    const node = createAgentNode({
      tools: allTools,
      createAgentRunnable: tools =>
        RunnableLambda.from(() => {
          seenTools.push(tools.length);
          return new AIMessage('final');
        }),
    });
    const { config } = createTestContext();

    const update = await node(
      state({ intent: 'search', toolRounds: MAX_TOOL_ROUNDS }),
      config,
    );

    expect(seenTools).toEqual([0]);
    expect(update.toolRounds).toBe(MAX_TOOL_ROUNDS);
  });

  it('routes to tools only when the last message has tool calls within budget', () => {
    const withCalls = new AIMessage({
      content: '',
      tool_calls: [{ id: 'c', name: 'get_entity', args: {} }],
    });
    expect(
      routeAfterAgent(state({ messages: [withCalls], toolRounds: 1 })),
    ).toBe('tools');
    expect(
      routeAfterAgent(
        state({ messages: [withCalls], toolRounds: MAX_TOOL_ROUNDS + 1 }),
      ),
    ).toBe('followups');
    expect(routeAfterAgent(state({ messages: [new AIMessage('done')] }))).toBe(
      'followups',
    );
  });
});

describe('followups node', () => {
  it('the disabled node returns no suggestions without any model call', async () => {
    const { config } = createTestContext();

    await expect(
      createNoFollowupsNode()(
        state({ messages: [new AIMessage('answer')] }),
        config,
      ),
    ).resolves.toEqual({ suggestions: [] });
  });

  it('returns up to 3 suggestions', async () => {
    const generator = RunnableLambda.from(() => ({
      suggestions: ['a', 'b', 'c'],
    }));
    const { config } = createTestContext();

    const update = await createFollowupsNode(generator)(
      state({ messages: [new AIMessage('answer')] }),
      config,
    );

    expect(update).toEqual({ suggestions: ['a', 'b', 'c'] });
  });

  it('returns no suggestions on failure or empty answer', async () => {
    const failing = RunnableLambda.from((): unknown => {
      throw new Error('down');
    });
    const { config } = createTestContext();

    await expect(
      createFollowupsNode(failing)(
        state({ messages: [new AIMessage('answer')] }),
        config,
      ),
    ).resolves.toEqual({ suggestions: [] });
    await expect(
      createFollowupsNode(failing)(
        state({ messages: [new AIMessage('')] }),
        config,
      ),
    ).resolves.toEqual({ suggestions: [] });
  });
});

it('ChatState exposes the expected channels', () => {
  expect(Object.keys(ChatState.spec)).toEqual(
    expect.arrayContaining([
      'messages',
      'question',
      'intent',
      'toolRounds',
      'suggestions',
      'summary',
      'userContext',
      'entityHint',
    ]),
  );
});
