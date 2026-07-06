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
  search: `The user wants to search or list items. First check the conversation history — if the answer is already there (e.g. an idea was just drafted or discussed), answer from history. Otherwise scan ALL knowledge base excerpts and list every matching idea or problem with its title, status, stage, and a one-sentence description. Never say you cannot search.`,
  explain: `The user wants a detailed explanation. First check the conversation history for relevant context — if an idea or problem was recently discussed or drafted, use that. Then enrich with knowledge base excerpts. Provide a thorough, structured answer using headings and bullet points where helpful.`,
  compare: `The user wants to compare items. First check the conversation history — items discussed earlier in this session are valid candidates for comparison. Then use knowledge base excerpts. Present a structured side-by-side comparison using a table or parallel bullet points.`,
  summarize: `The user wants a summary. First check the conversation history for context about what was discussed or created in this session. Then synthesise the knowledge base excerpts into a concise summary covering key themes, active stages, and notable authors.`,
  navigate: `The user wants help navigating the platform. First check the conversation history for any relevant context. Then explain the relevant platform features clearly. If the knowledge base has no relevant info, describe how the platform generally works.`,
  create_idea: `The user wants to create a new idea. Write a short, friendly confirmation (2-3 sentences) summarising what you understood and confirming you will draft an idea for them. Do not ask for more information. End your message with "Here's what I'll draft for you:".`,
  create_problem: `The user wants to create a new problem. Write a short, friendly confirmation (2-3 sentences) summarising the problem you understood. Remind the user it will be saved as a draft and they can edit it before publishing.`,
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
    pageContext?: {
      type: 'idea_form' | 'problem_form';
      title?: string;
      description?: string;
      tags?: string[];
      linkedProblemIds?: string[];
    } | null,
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
      pageContext: pageContext ?? null,
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

    const FIELD_ACTION_REGEX =
      /<field_action field="(tags|linked_problems)" values='(\[.*?\])'\/>/;
    const fieldActionMatch = FIELD_ACTION_REGEX.exec(fullAnswer);
    const cleanAnswer = fullAnswer.replace(FIELD_ACTION_REGEX, '').trimEnd();

    if (fieldActionMatch) {
      try {
        const field = fieldActionMatch[1] as 'tags' | 'linked_problems';
        const values = JSON.parse(fieldActionMatch[2]) as string[];
        res.write(sseEvent({ type: 'field_action', field, values }));
      } catch {}
    }

    const suggestions = await this.gemini.generateFollowUpSuggestions(
      message,
      cleanAnswer,
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
          content: cleanAnswer,
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
    pageContext,
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
    pageContext?: {
      type: 'idea_form' | 'problem_form';
      title?: string;
      description?: string;
      tags?: string[];
      linkedProblemIds?: string[];
    } | null;
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

    let pageContextSection = '';
    if (pageContext) {
      const lines = [
        'The user is currently editing a draft. Use this context to answer questions about it.',
      ];
      lines.push(
        `Type: ${pageContext.type === 'idea_form' ? 'Idea draft' : 'Problem draft'}`,
      );
      if (pageContext.title) lines.push(`Title: "${pageContext.title}"`);
      if (pageContext.description)
        lines.push(`Description: "${pageContext.description.slice(0, 500)}"`);
      if (pageContext.type === 'idea_form') {
        if (pageContext.tags?.length)
          lines.push(`Tags: [${pageContext.tags.join(', ')}]`);
        if (pageContext.linkedProblemIds?.length)
          lines.push(
            `Linked problem IDs: [${pageContext.linkedProblemIds.join(', ')}]`,
          );
      }
      lines.push(
        'If the user asks for tag suggestions, end your response with exactly: <field_action field="tags" values=\'["tag1","tag2"]\'/> — replace with real tag strings, no markdown. Only include this when the user explicitly requests tag suggestions.',
      );
      lines.push(
        'If the user asks to suggest problems to link, end your response with exactly: <field_action field="linked_problems" values=\'["id1","id2"]\'/> — replace with real problem IDs. Only include this when the user explicitly requests problem suggestions.',
      );
      pageContextSection = lines.join('\n');
    }

    return [
      'You are a helpful AI assistant for the Idea Platform — an innovation hub where teams submit ideas and problems.',
      intentInstruction,
      'If no excerpts match the query but the conversation history contains relevant context (e.g. an idea or problem was just drafted or discussed), use that context to answer. Only tell the user nothing was found if neither the knowledge base nor the conversation history has relevant information.',
      'Only decline to answer if the question is entirely unrelated to the Idea Platform (e.g. general coding questions, weather, etc.).',
      'IMPORTANT: Never mention sources, file names, document names, or knowledge base references in your response. Do not write things like "(Source: ...)", "[1]", "according to faq.md", or any similar attribution. Respond as if the knowledge comes from you directly.',
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
      ...(pageContextSection
        ? ['', '== Current Page Context ==', pageContextSection]
        : []),
      '',
      '== Question ==',
      message,
    ].join('\n');
  }
}
