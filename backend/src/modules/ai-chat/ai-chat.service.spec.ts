import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import type { Response } from 'express';

import type { PrismaService } from '../../core/prisma/prisma.service';
import type { KnowledgeRetrievalService } from '../rag/knowledge-retrieval.service';
import type { ChatGraphFactory } from './agent/chat-graph.factory';
import { CHAT_CONTEXT_KEY, type ChatRunContext } from './agent/chat.types';
import type { SummaryService } from './agent/summary.service';
import { AiChatService } from './ai-chat.service';

type StreamPart =
  | ['messages', [AIMessageChunk, { langgraph_node: string }]]
  | ['values', unknown];

class FakeResponse extends EventEmitter {
  writes: string[] = [];
  writableEnded = false;
  write(chunk: string) {
    this.writes.push(chunk);
    return true;
  }
  end() {
    this.writableEnded = true;
  }
  events() {
    return this.writes.map(w => JSON.parse(w.replace(/^data: /, '').trim()));
  }
}

function finalState(overrides: Record<string, unknown> = {}) {
  return {
    messages: [new AIMessage('Hello there')],
    intent: 'general',
    toolRounds: 0,
    suggestions: ['What next?'],
    ...overrides,
  };
}

function setup(
  script: (ctx: ChatRunContext) => Generator<StreamPart>,
  env: Record<string, string> = {},
) {
  const prisma = {
    chatSession: {
      findFirst: jest.fn().mockResolvedValue({ id: 's1', title: null }),
      update: jest.fn().mockResolvedValue({}),
    },
    user: { findUnique: jest.fn().mockResolvedValue({ role: 'MEMBER' }) },
    chatMessage: {
      create: jest
        .fn()
        .mockImplementation(({ data }) => ({ id: `${data.role}-id`, ...data })),
    },
    $transaction: jest
      .fn()
      .mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const stream = jest
    .fn()
    .mockImplementation((_input: unknown, config: RunnableConfig) => {
      const ctx = config.configurable![CHAT_CONTEXT_KEY] as ChatRunContext;
      return Promise.resolve(script(ctx));
    });
  const graphFactory = { graph: { stream } } as unknown as ChatGraphFactory;
  const maybeUpdate = jest.fn().mockResolvedValue(undefined);
  const summary = { maybeUpdate } as unknown as SummaryService;
  const service = new AiChatService(
    prisma as unknown as PrismaService,
    {} as KnowledgeRetrievalService,
    graphFactory,
    summary,
    { get: (key: string) => env[key] } as unknown as ConfigService,
  );
  return { service, prisma, stream, maybeUpdate };
}

const token = (text: string, node = 'agent'): StreamPart => [
  'messages',
  [new AIMessageChunk(text), { langgraph_node: node }],
];

describe('AiChatService.streamMessage', () => {
  it('streams intent, agent tokens, side events, suggestions and done, then persists', async () => {
    const { service, prisma, maybeUpdate } = setup(function* (ctx) {
      ctx.emit({ type: 'intent', intent: 'search', entityHint: null });
      yield token('{"intent":"search"}', 'classify');
      yield token('Hello ');
      ctx.sources.add([
        { type: 'idea', id: 'i1', title: 'Parking', relevance: 0.9 },
      ]);
      ctx.emit({ type: 'field_action', field: 'tags', values: ['iot'] });
      yield token('there');
      yield ['values', finalState()];
    });
    const res = new FakeResponse();

    await service.streamMessage(
      'u1',
      's1',
      'hi',
      res as unknown as Response,
      null,
    );

    expect(res.events()).toEqual([
      { type: 'intent', intent: 'search', entityHint: null },
      { type: 'token', content: 'Hello ' },
      { type: 'field_action', field: 'tags', values: ['iot'] },
      { type: 'token', content: 'there' },
      { type: 'suggestions', suggestions: ['What next?'] },
      { type: 'done', messageId: 'assistant-id' },
    ]);
    const [userCall, assistantCall] = prisma.chatMessage.create.mock.calls.map(
      c => c[0].data,
    );
    expect(userCall).toMatchObject({
      role: 'user',
      content: 'hi',
      sources: [],
    });
    expect(assistantCall).toMatchObject({
      role: 'assistant',
      content: 'Hello there',
      sources: [{ type: 'idea', id: 'i1', title: 'Parking', relevance: 0.9 }],
    });
    expect(assistantCall.createdAt.getTime()).toBeGreaterThan(
      userCall.createdAt.getTime(),
    );
    expect(prisma.chatSession.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { title: 'hi' },
    });
    expect(res.writableEnded).toBe(true);
    expect(maybeUpdate).toHaveBeenCalledWith('s1');
  });

  it('streams a fallback answer when the model produced no text', async () => {
    const { service, prisma } = setup(function* () {
      yield [
        'values',
        finalState({ messages: [new AIMessage('')], suggestions: [] }),
      ];
    });
    const res = new FakeResponse();

    await service.streamMessage(
      'u1',
      's1',
      'hi',
      res as unknown as Response,
      null,
    );

    const tokens = res.events().filter(e => e.type === 'token');
    expect(tokens).toEqual([
      {
        type: 'token',
        content:
          "I couldn't complete that request. Please try rephrasing your question.",
      },
    ]);
    expect(prisma.chatMessage.create.mock.calls[1][0].data.content).toBe(
      "I couldn't complete that request. Please try rephrasing your question.",
    );
  });

  it('sends an error and persists nothing when the graph fails', async () => {
    const { service, prisma } = setup(function* () {
      yield token('partial');
      throw new Error('gemini down');
    });
    const res = new FakeResponse();

    await service.streamMessage(
      'u1',
      's1',
      'hi',
      res as unknown as Response,
      null,
    );

    expect(res.events().at(-1)).toEqual({
      type: 'error',
      message: 'AI generation failed',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(res.writableEnded).toBe(true);
  });

  it('stops without persisting when the client disconnects', async () => {
    const res = new FakeResponse();
    const { service, prisma, stream } = setup(function* () {
      yield token('Hel');
      res.emit('close');
      throw new Error('aborted');
    });

    await service.streamMessage(
      'u1',
      's1',
      'hi',
      res as unknown as Response,
      null,
    );

    const config = stream.mock.calls[0][1] as RunnableConfig;
    expect(config.signal?.aborted).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(res.events().some(e => e.type === 'error')).toBe(false);
  });

  it('passes identity, role and page context to the graph', async () => {
    const pageContext = { type: 'idea_form' as const, title: 'X' };
    const { service, stream } = setup(function* () {
      yield ['values', finalState()];
    });

    await service.streamMessage(
      'u1',
      's1',
      'hi',
      new FakeResponse() as unknown as Response,
      pageContext,
    );

    const [input, config] = stream.mock.calls[0] as [
      unknown,
      RunnableConfig & { streamMode: string[] },
    ];
    expect(input).toEqual({ question: 'hi' });
    expect(config.streamMode).toEqual(['messages', 'values']);
    expect(config.configurable![CHAT_CONTEXT_KEY]).toMatchObject({
      sessionId: 's1',
      userId: 'u1',
      role: 'MEMBER',
      pageContext,
    });
  });

  it('returns Session not found for a foreign session', async () => {
    const { service, prisma, stream } = setup(function* () {
      yield ['values', finalState()];
    });
    prisma.chatSession.findFirst.mockResolvedValue(null);
    const res = new FakeResponse();

    await service.streamMessage(
      'u1',
      'other',
      'hi',
      res as unknown as Response,
      null,
    );

    expect(res.events()).toEqual([
      { type: 'error', message: 'Session not found' },
    ]);
    expect(stream).not.toHaveBeenCalled();
  });
});

describe('AiChatService.getSessionMessages', () => {
  const rows = [
    {
      id: 'm1',
      role: 'assistant',
      content: 'hi',
      sources: [{ type: 'idea', id: 'i1', title: 'A', relevance: 1 }],
      createdAt: new Date(0),
    },
  ];

  function withRows(env: Record<string, string>) {
    const harness = setup(function* () {}, env);
    (harness.prisma as unknown as Record<string, unknown>).chatMessage = {
      findMany: jest.fn().mockResolvedValue(rows),
    };
    return harness.service;
  }

  it('returns sources by default', async () => {
    const result = await withRows({}).getSessionMessages('u1', 's1');

    expect(result[0].sources).toEqual(rows[0].sources);
  });

  it('hides sources when AI_CHAT_SOURCES_ENABLED is false', async () => {
    const result = await withRows({
      AI_CHAT_SOURCES_ENABLED: 'false',
    }).getSessionMessages('u1', 's1');

    expect(result[0].sources).toEqual([]);
    expect(result[0].content).toBe('hi');
  });
});
