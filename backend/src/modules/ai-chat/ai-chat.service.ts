import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';

import { PrismaService } from '../../core/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import {
  type KbStats,
  KnowledgeRetrievalService,
} from '../rag/knowledge-retrieval.service';
import type {
  ChatMessageResponseDto,
  ChatSessionDto,
} from './dto/chat-session.dto';
import {
  type ChatIntent,
  IntentClassifierService,
} from './intent-classifier.service';
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

const INTENT_SYSTEM_OVERRIDES: Partial<Record<ChatIntent, string>> = {
  search:
    'The user wants to search or list items. Scan ALL knowledge base excerpts and list every matching idea or problem with its title, status, stage, and a one-sentence description. Never say you cannot search.',
  explain:
    'The user wants a detailed explanation. Provide a thorough, structured answer using the knowledge base excerpts. Use headings and bullet points where helpful.',
  compare:
    'The user wants to compare items. Present a structured side-by-side comparison using the knowledge base excerpts. Use a table or parallel bullet points.',
  summarize:
    'The user wants a summary. Synthesise the knowledge base excerpts into a concise summary covering key themes, active stages, and notable authors.',
  navigate:
    'The user wants help navigating the platform. Explain the relevant platform features clearly. If the knowledge base has no relevant info, describe how the platform generally works.',
};

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly retrieval: KnowledgeRetrievalService,
    private readonly userContextService: UserContextService,
    private readonly intentClassifier: IntentClassifierService,
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
    return rows as unknown as import('./dto/chat-session.dto').ChatMessageResponseDto[];
  }

  async getKbStats(): Promise<KbStats> {
    return await this.retrieval.getStats();
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

    const [userContext, history, classified] = await Promise.all([
      this.userContextService.getContext(userId),
      this.prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT,
        select: { role: true, content: true },
      }),
      this.intentClassifier.classify(message),
    ]);

    res.write(
      sseEvent({
        type: 'intent',
        intent: classified.intent,
        entityHint: classified.entityHint,
      }),
    );

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
      intent: classified.intent,
    });

    let fullAnswer = '';
    try {
      await this.gemini.streamChatAnswer(prompt, token => {
        fullAnswer += token;
        res.write(sseEvent({ type: 'token', content: token }));
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Gemini stream failed for session ${sessionId}: ${detail}`,
        err instanceof Error ? err.stack : undefined,
      );
      res.write(
        sseEvent({ type: 'error', message: 'AI generation failed', detail }),
      );
      res.end();
      return;
    }

    const suggestions = await this.gemini.generateFollowUpSuggestions(
      message,
      fullAnswer,
    );
    if (suggestions.length > 0) {
      res.write(sseEvent({ type: 'suggestions', suggestions }));
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
    intent,
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
    intent: ChatIntent;
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

    const intentInstruction =
      INTENT_SYSTEM_OVERRIDES[intent] ??
      'Answer helpfully using the knowledge base excerpts below.';

    return [
      'You are a helpful AI assistant for the Idea Platform — an innovation hub where teams submit ideas and problems.',
      intentInstruction,
      'If no excerpts match the query, say clearly that no matching ideas or problems were found in the knowledge base at this time, and suggest the user browse the platform directly.',
      'Only decline to answer if the question is entirely unrelated to the Idea Platform (e.g. general coding questions, weather, etc.).',
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
