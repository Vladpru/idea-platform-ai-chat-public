import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage } from '@langchain/core/messages';
import { RunnableLambda } from '@langchain/core/runnables';

import type { PrismaService } from '../../../core/prisma/prisma.service';
import type { LlmProvider } from './llm/llm-provider.interface';
import { SummaryService } from './summary.service';

function setup(total: number, summaryMessageCount = 0) {
  const prisma = {
    chatSession: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ summary: 'old', summaryMessageCount }),
      update: jest.fn().mockResolvedValue({}),
    },
    chatMessage: {
      count: jest.fn().mockResolvedValue(total),
      findMany: jest.fn().mockImplementation(({ take }: { take: number }) =>
        Promise.resolve(
          Array.from({ length: take }, (_, i) => ({
            role: i % 2 ? 'assistant' : 'user',
            content: `m${i}`,
          })),
        ),
      ),
    },
  };
  const prompts: string[] = [];
  const model = RunnableLambda.from((prompt: string) => {
    prompts.push(prompt);
    return new AIMessage('  new summary  ');
  }) as unknown as BaseChatModel;
  const llm: LlmProvider = { name: 'fake', createChatModels: () => [model] };
  const service = new SummaryService(prisma as unknown as PrismaService, llm);
  return { service, prisma, prompts };
}

describe('SummaryService', () => {
  it('does nothing while 20 or fewer messages are unsummarized', async () => {
    const { service, prisma } = setup(30);

    await service.maybeUpdate('s1');

    expect(prisma.chatMessage.findMany).not.toHaveBeenCalled();
    expect(prisma.chatSession.update).not.toHaveBeenCalled();
  });

  it('summarizes everything except the last 10 messages once more than 20 are pending', async () => {
    const { service, prisma, prompts } = setup(31);

    await service.maybeUpdate('s1');

    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith({
      where: { sessionId: 's1' },
      orderBy: { createdAt: 'asc' },
      skip: 0,
      take: 21,
      select: { role: true, content: true },
    });
    expect(prompts[0]).toContain('Previous summary: old');
    expect(prisma.chatSession.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { summary: 'new summary', summaryMessageCount: 21 },
    });
  });

  it('continues from the previous summary boundary', async () => {
    const { service, prisma } = setup(60, 21);

    await service.maybeUpdate('s1');

    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 21, take: 29 }),
    );
    expect(prisma.chatSession.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { summary: 'new summary', summaryMessageCount: 50 },
    });
  });

  it('does nothing for a missing session', async () => {
    const { service, prisma } = setup(100);
    prisma.chatSession.findUnique.mockResolvedValue(null);

    await service.maybeUpdate('gone');

    expect(prisma.chatMessage.count).not.toHaveBeenCalled();
  });
});
