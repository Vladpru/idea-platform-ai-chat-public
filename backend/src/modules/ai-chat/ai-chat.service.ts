import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { KnowledgeRetrievalService } from '../rag/knowledge-retrieval.service';
import type { ChatResponseDto } from './dto/chat-response.dto';

const HISTORY_LIMIT = 10;
const REFORMULATION_HISTORY_LIMIT = 4;
const RAG_TOP_K = 5;
const REFORMULATION_MAX_CHARS = 120;
const CONTEXT_PRONOUNS =
  /\b(it|its|this|that|these|those|they|them|their|he|she|here|there|same|such)\b/i;
const FOLLOWUP_WORDS =
  /\b(also|too|as well|another|more|else|other|and what|what about|how about)\b/i;

@Injectable()
export class AiChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly retrieval: KnowledgeRetrievalService,
  ) {}

  async sendMessage(userId: string, message: string): Promise<ChatResponseDto> {
    const [user, history] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      }),
      this.prisma.chatMessage.findMany({
        where: { userId },
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

    const ragChunks = await this.retrieval.retrieve(retrievalQuery, RAG_TOP_K);

    const prompt = this.buildPrompt({
      user,
      ragChunks,
      history: orderedHistory,
      message,
    });
    const answer = await this.gemini.generateChatAnswer(prompt);

    const sources = ragChunks.map(c => ({
      title: c.source,
      relevance: c.relevance,
    }));

    await this.prisma.chatMessage.createMany({
      data: [
        { userId, role: 'user', content: message, sources: [] },
        { userId, role: 'assistant', content: answer, sources },
      ],
    });

    return {
      answer,
      sources,
      history: [
        ...orderedHistory.map(h => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user' as const, content: message },
        { role: 'assistant' as const, content: answer },
      ],
    };
  }

  private needsReformulation(message: string): boolean {
    if (message.length > REFORMULATION_MAX_CHARS) return false;
    return CONTEXT_PRONOUNS.test(message) || FOLLOWUP_WORDS.test(message);
  }

  private buildPrompt({
    user,
    ragChunks,
    history,
    message,
  }: {
    user: { firstName: string | null; lastName: string | null; email: string };
    ragChunks: {
      source: string;
      content: string;
      relevance: number;
      metadata: Record<string, unknown>;
    }[];
    history: { role: string; content: string }[];
    message: string;
  }): string {
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

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

    const historySection = history.length
      ? history
          .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
          .join('\n')
      : 'No prior conversation.';

    return [
      'You are a helpful AI assistant for the Idea Platform. Use ONLY the knowledge base excerpts below to answer.',
      'If the answer is not in the excerpts, say so clearly.',
      '',
      '== User ==',
      `Name: ${name}`,
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
