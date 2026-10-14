import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { RunnableLambda } from '@langchain/core/runnables';
import type { ConfigService } from '@nestjs/config';

import type { PrismaService } from '../../../core/prisma/prisma.service';
import type { UserContextService } from '../user-context.service';
import { ChatGraphFactory } from './chat-graph.factory';
import type { LlmProvider } from './llm/llm-provider.interface';
import type { ChatToolsProvider } from './tools/chat-tools.provider';

function build(env: Record<string, string>) {
  const model = {
    withStructuredOutput: () => RunnableLambda.from(() => ({})),
    bindTools: () => RunnableLambda.from(() => ({})),
  } as unknown as BaseChatModel;
  const createChatModels = jest.fn().mockReturnValue([model]);
  const llm: LlmProvider = { name: 'fake', createChatModels };
  new ChatGraphFactory(
    llm,
    { tools: {} } as unknown as ChatToolsProvider,
    {} as PrismaService,
    {} as UserContextService,
    { get: (key: string) => env[key] } as unknown as ConfigService,
  );
  return createChatModels;
}

const followupCalls = (createChatModels: jest.Mock) =>
  createChatModels.mock.calls.filter(
    ([role, options]) =>
      role === 'light' &&
      (options as { temperature?: number }).temperature === 0.5,
  );

describe('ChatGraphFactory follow-up suggestions flag', () => {
  it('creates the follow-up model by default', () => {
    expect(followupCalls(build({}))).toHaveLength(1);
  });

  it('creates no follow-up model when AI_CHAT_FOLLOWUPS_ENABLED is false', () => {
    expect(
      followupCalls(build({ AI_CHAT_FOLLOWUPS_ENABLED: 'false' })),
    ).toHaveLength(0);
  });
});
