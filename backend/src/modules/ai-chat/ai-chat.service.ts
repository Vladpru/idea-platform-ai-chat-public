import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  type KbStats,
  KnowledgeRetrievalService,
} from '../rag/knowledge-retrieval.service';
import { ChatGraphFactory } from './agent/chat-graph.factory';
import type { ChatStateType } from './agent/chat-state';
import {
  CHAT_CONTEXT_KEY,
  type ChatPageContext,
  type ChatRunContext,
  type ChatSideEvent,
} from './agent/chat.types';
import { isFlagEnabled } from './agent/lib/env-flag';
import { messageText, toolCallNames } from './agent/lib/messages';
import { SourceCollector } from './agent/source-collector';
import { SummaryService } from './agent/summary.service';
import type {
  ChatMessageResponseDto,
  ChatSessionDto,
} from './dto/chat-session.dto';

const SESSION_TITLE_MAX_CHARS = 60;
const RUN_TIMEOUT_MS = 60_000;
const RECURSION_LIMIT = 25;
const EMPTY_ANSWER_FALLBACK =
  "I couldn't complete that request. Please try rephrasing your question.";

type SsePayload =
  | ChatSideEvent
  | { type: 'token'; content: string }
  | { type: 'suggestions'; suggestions: string[] }
  | { type: 'done'; messageId: string }
  | { type: 'error'; message: string };

function sseEvent(payload: SsePayload): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly retrieval: KnowledgeRetrievalService,
    private readonly graphFactory: ChatGraphFactory,
    private readonly summaryService: SummaryService,
    private readonly config: ConfigService,
  ) {}

  async listSessions(userId: string): Promise<ChatSessionDto[]> {
    return await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  async createSession(userId: string): Promise<ChatSessionDto> {
    return await this.prisma.chatSession.create({
      data: { userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.chatSession.delete({ where: { id: sessionId } });
  }

  async getSessionMessages(
    userId: string,
    sessionId: string,
  ): Promise<ChatMessageResponseDto[]> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Session not found');
    const rows = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        sources: true,
        createdAt: true,
      },
    });
    const showSources = isFlagEnabled(
      this.config.get<string>('AI_CHAT_SOURCES_ENABLED'),
    );
    const messages = showSources
      ? rows
      : rows.map(row => ({ ...row, sources: [] }));
    return messages as unknown as ChatMessageResponseDto[];
  }

  async getKbStats(): Promise<KbStats> {
    return await this.retrieval.getStats();
  }

  async streamMessage(
    userId: string,
    sessionId: string,
    message: string,
    res: Response,
    pageContext?: ChatPageContext | null,
  ): Promise<void> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      this.write(res, { type: 'error', message: 'Session not found' });
      res.end();
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const clientAbort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) clientAbort.abort();
    });
    const signal = AbortSignal.any([
      clientAbort.signal,
      AbortSignal.timeout(RUN_TIMEOUT_MS),
    ]);

    const context: ChatRunContext = {
      sessionId,
      userId,
      role: user?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      pageContext: pageContext ?? null,
      emit: event => this.write(res, event),
      sources: new SourceCollector(),
    };

    const startedAt = Date.now();
    let streamedText = '';
    let finalState: ChatStateType | undefined;

    try {
      const stream = await this.graphFactory.graph.stream(
        { question: message },
        {
          configurable: { [CHAT_CONTEXT_KEY]: context },
          streamMode: ['messages', 'values'],
          signal,
          recursionLimit: RECURSION_LIMIT,
        },
      );
      for await (const part of stream) {
        const [mode, chunk] = part as [string, unknown];
        if (mode === 'messages') {
          const [messageChunk, metadata] = chunk as [
            { content: unknown },
            { langgraph_node?: string },
          ];
          if (metadata.langgraph_node !== 'agent') continue;
          const text = messageText(messageChunk.content);
          if (!text) continue;
          streamedText += text;
          this.write(res, { type: 'token', content: text });
        } else if (mode === 'values') {
          finalState = chunk as ChatStateType;
        }
      }
    } catch (error) {
      if (clientAbort.signal.aborted) {
        this.logger.log(`Client disconnected from session ${sessionId}`);
        return;
      }
      const timedOut = signal.aborted;
      this.logger.error(
        `Chat graph failed for session ${sessionId}${timedOut ? ' (timeout)' : ''}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.write(res, {
        type: 'error',
        message: timedOut ? 'AI response timed out' : 'AI generation failed',
      });
      res.end();
      return;
    }

    if (clientAbort.signal.aborted) return;

    if (!finalState) {
      this.write(res, { type: 'error', message: 'AI generation failed' });
      res.end();
      return;
    }

    let answer = streamedText.trim();
    if (!answer) {
      answer =
        messageText(finalState.messages.at(-1)?.content).trim() ||
        EMPTY_ANSWER_FALLBACK;
      this.write(res, { type: 'token', content: answer });
    }

    if (finalState.suggestions.length > 0) {
      this.write(res, {
        type: 'suggestions',
        suggestions: finalState.suggestions,
      });
    }

    try {
      const userCreatedAt = new Date();
      const assistantCreatedAt = new Date(userCreatedAt.getTime() + 1);
      const [, assistantMessage] = await this.prisma.$transaction([
        this.prisma.chatMessage.create({
          data: {
            userId,
            sessionId,
            role: 'user',
            content: message,
            sources: [],
            createdAt: userCreatedAt,
          },
        }),
        this.prisma.chatMessage.create({
          data: {
            userId,
            sessionId,
            role: 'assistant',
            content: answer,
            sources: context.sources.list() as unknown as Prisma.InputJsonValue,
            createdAt: assistantCreatedAt,
          },
        }),
      ]);

      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: session.title
          ? { updatedAt: new Date() }
          : { title: message.slice(0, SESSION_TITLE_MAX_CHARS) },
      });

      this.write(res, { type: 'done', messageId: assistantMessage.id });
      res.end();
    } catch (error) {
      this.logger.error(
        `Failed to persist chat messages for session ${sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      this.write(res, {
        type: 'error',
        message: 'Failed to save the conversation',
      });
      res.end();
      return;
    }

    this.logger.log(
      JSON.stringify({
        event: 'ai_chat_run',
        sessionId,
        intent: finalState.intent,
        tools: toolCallNames(finalState.messages),
        toolRounds: finalState.toolRounds,
        latencyMs: Date.now() - startedAt,
      }),
    );

    void this.summaryService.maybeUpdate(sessionId).catch((error: unknown) => {
      this.logger.warn(
        `Summary update failed for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }

  private write(res: Response, payload: SsePayload): void {
    if (!res.writableEnded) res.write(sseEvent(payload));
  }
}
