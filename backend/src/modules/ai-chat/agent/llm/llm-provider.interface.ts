import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Runnable } from '@langchain/core/runnables';

export type LlmRole = 'agent' | 'light';

export interface ChatModelOptions {
  temperature?: number;
}

export interface LlmProvider {
  readonly name: string;
  createChatModels(role: LlmRole, options?: ChatModelOptions): BaseChatModel[];
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export function withModelFallbacks<RunInput, RunOutput>(
  models: BaseChatModel[],
  build: (model: BaseChatModel) => Runnable<RunInput, RunOutput>,
): Runnable<RunInput, RunOutput> {
  if (models.length === 0) {
    throw new Error('No chat models configured');
  }
  const [primary, ...fallbacks] = models.map(build);
  return fallbacks.length > 0 ? primary.withFallbacks({ fallbacks }) : primary;
}
