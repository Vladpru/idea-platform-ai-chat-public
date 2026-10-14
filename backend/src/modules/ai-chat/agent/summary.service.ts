import type { BaseMessage } from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';
import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { messageText } from './lib/messages';
import {
  LLM_PROVIDER,
  type LlmProvider,
  withModelFallbacks,
} from './llm/llm-provider.interface';
import { buildSummaryPrompt } from './prompts/intent.prompts';

export const SUMMARY_KEEP_RECENT = 10;
export const SUMMARY_TRIGGER = 20;
const SUMMARY_MAX_CHARS = 1500;

@Injectable()
export class SummaryService {
  private readonly summarizer: Runnable<string, BaseMessage>;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_PROVIDER) llm: LlmProvider,
  ) {
    this.summarizer = withModelFallbacks(
      llm.createChatModels('light', { temperature: 0 }),
      model => model,
    );
  }

  async maybeUpdate(sessionId: string): Promise<void> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { summary: true, summaryMessageCount: true },
    });
    if (!session) return;

    const total = await this.prisma.chatMessage.count({ where: { sessionId } });
    const pending = total - SUMMARY_KEEP_RECENT - session.summaryMessageCount;
    if (pending <= SUMMARY_TRIGGER) return;

    const rows = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      skip: session.summaryMessageCount,
      take: pending,
      select: { role: true, content: true },
    });

    const response = await this.summarizer.invoke(
      buildSummaryPrompt(session.summary, rows),
    );
    const summary = messageText(response.content)
      .trim()
      .slice(0, SUMMARY_MAX_CHARS);
    if (!summary) return;

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        summary,
        summaryMessageCount: session.summaryMessageCount + rows.length,
      },
    });
  }
}
