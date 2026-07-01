import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';

import { PrismaService } from '../../core/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { KnowledgeRetrievalService } from '../rag/knowledge-retrieval.service';
import type {
  ChatMessageResponseDto,
  ChatSessionDto,
} from './dto/chat-session.dto';
import { UserContextService } from './user-context.service';

const HISTORY_LIMIT = 10;
const REFORMULATION_HISTORY_LIMIT = 4;
const RAG_TOP_K = 5;
const REFORMULATION_MAX_CHARS = 120;
const MAX_HISTORY_CONTENT_CHARS = 8000;
const SESSION_TITLE_MAX_CHARS = 60;
const CONTEXT_PRONOUNS =
  /\b(it|its|this|that|these|those|they|them|their|he|she|here|there|same|such)\b/i;
const FOLLOWUP_WORDS =
  /\b(also|too|as well|another|more|else|other|and what|what about|how about)\b/i;

function sseEvent(payload: object): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly retrieval: KnowledgeRetrievalService,
    private readonly userContextService: UserContextService,
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
      select: { id: true, role: true, content: true, sources: true, createdAt: true },
    });
    return rows as unknown as import('./dto/chat-session.dto').ChatMessageResponseDto[];
  }

  async streamMessage(
    userId: string,
    sessionId: string,
    message: string,
    res: Response,
  ): Promise<void> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      res.write(sseEvent({ type: 'error', message: 'Session not found' }));
      res.end();
      return;
    }

    const [userContext, history] = await Promise.all([
      this.userContextService.getContext(userId),
      this.prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT,
        select: { role: true, content: true },
      }),
    ]);

    const orderedHistory = history.reverse();

    const retrievalQuery =
      orderedHistory.length > 0 && this.needsReformulation(message)
        ? ((await this.gemini.reformulateQuery(
            message,
            orderedHistory.slice(-REFORMULATION_HISTORY_LIMIT),
          )) ?? message)
        : message;

    const ragChunks = await this.retrieval.retrieve(
      retrievalQuery,
      RAG_TOP_K,
      userContext.role,
    );

    const prompt = this.buildPrompt({
      userContext,
      ragChunks,
      history: orderedHistory,
      message,
    });

    let fullAnswer = '';
    try {
      await this.gemini.streamChatAnswer(prompt, token => {
        fullAnswer += token;
        res.write(sseEvent({ type: 'token', content: token }));
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(`Gemini stream failed for session ${sessionId}: ${detail}`, err instanceof Error ? err.stack : undefined);
      res.write(sseEvent({ type: 'error', message: 'AI generation failed', detail }));
      res.end();
      return;
    }

    const sources = ragChunks.map(c => ({
      title: c.source,
      relevance: c.relevance,
    }));

    const [, assistantMessage] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          userId,
          sessionId,
          role: 'user',
          content: message,
          sources: [],
        },
      }),
      this.prisma.chatMessage.create({
        data: {
          userId,
          sessionId,
          role: 'assistant',
          content: fullAnswer,
          sources,
        },
      }),
    ]);

    if (!session.title) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: message.slice(0, SESSION_TITLE_MAX_CHARS) },
      });
    } else {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    res.write(sseEvent({ type: 'done', messageId: assistantMessage.id }));
    res.end();
  }

  private needsReformulation(message: string): boolean {
    if (message.length > REFORMULATION_MAX_CHARS) return false;
    return CONTEXT_PRONOUNS.test(message) || FOLLOWUP_WORDS.test(message);
  }

  private buildPrompt({
    userContext,
    ragChunks,
    history,
    message,
  }: {
    userContext: {
      name: string;
      role: string;
      memberSinceDays: number;
      contributionScore: number;
    };
    ragChunks: {
      source: string;
      content: string;
      relevance: number;
      metadata: Record<string, unknown>;
    }[];
    history: { role: string; content: string }[];
    message: string;
  }): string {
    const knowledgeSection = ragChunks.length
      ? ragChunks
          .map((c, i) => {
            const meta = Object.entries(c.metadata)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(', ');
            const metaLine = meta ? `\n    Metadata: ${meta}` : '';
            return `[${i + 1}] ${c.content}\n    Source: ${c.source}${metaLine}`;
          })
          .join('\n\n')
      : 'No relevant knowledge base excerpts found.';

    const truncatedHistory: typeof history = [];
    let historyChars = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const line = `${history[i].role === 'user' ? 'User' : 'Assistant'}: ${history[i].content}`;
      if (historyChars + line.length > MAX_HISTORY_CONTENT_CHARS) break;
      truncatedHistory.unshift(history[i]);
      historyChars += line.length;
    }

    const historySection = truncatedHistory.length
      ? truncatedHistory
          .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
          .join('\n')
      : 'No prior conversation.';

    return [
      'You are a helpful AI assistant for the Idea Platform. Use ONLY the knowledge base excerpts below to answer questions about ideas, problems, and platform activity.',
      'If a question is outside the scope of the knowledge base, do not say "the answer is not in the excerpts". Instead, politely let the user know you can only help with Idea Platform topics, and suggest what you can assist them with — such as exploring ideas, finding problems, understanding platform activity, or navigating features.',
      '',
      '== User ==',
      `Name: ${userContext.name}`,
      `Role: ${userContext.role}`,
      `Member for: ${userContext.memberSinceDays} days`,
      `Contribution score: ${userContext.contributionScore}`,
      '',
      '== Knowledge Base ==',
      knowledgeSection,
      '',
      '== Conversation History ==',
      historySection,
      '',
      '== Question ==',
      message,
    ].join('\n');
  }
}
