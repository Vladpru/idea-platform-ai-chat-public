import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  ChatModelOptions,
  LlmProvider,
  LlmRole,
} from './llm-provider.interface';

export const DEFAULT_OPENROUTER_MODEL =
  'nvidia/nemotron-3-super-120b-a12b:free';
export const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MAX_MODELS_PER_ROLE = 3;

@Injectable()
export class OpenRouterLlmProvider implements LlmProvider {
  readonly name = 'openrouter';

  constructor(private readonly config: ConfigService) {}

  createChatModels(
    role: LlmRole,
    options: ChatModelOptions = {},
  ): BaseChatModel[] {
    const apiKey = this.config.getOrThrow<string>('OPENROUTER_API_KEY').trim();
    const baseURL =
      this.readEnv('OPENROUTER_BASE_URL') ?? DEFAULT_OPENROUTER_BASE_URL;
    return this.resolveModelNames(role).map(
      model =>
        new ChatOpenAI({
          model,
          apiKey,
          temperature: options.temperature,
          maxRetries: 1,
          useResponsesApi: false,
          configuration: { baseURL },
        }),
    );
  }

  resolveModelNames(role: LlmRole): string[] {
    const agentModels = this.parseModelList(this.readEnv('LLM_AGENT_MODEL'));
    const models =
      role === 'light'
        ? this.parseModelList(this.readEnv('LLM_LIGHT_MODEL'))
        : agentModels;
    const resolved = models.length > 0 ? models : agentModels;
    return (resolved.length > 0 ? resolved : [DEFAULT_OPENROUTER_MODEL]).slice(
      0,
      MAX_MODELS_PER_ROLE,
    );
  }

  private parseModelList(value: string | undefined): string[] {
    if (!value) return [];
    const names = value
      .split(',')
      .map(name => name.trim())
      .filter(Boolean);
    return [...new Set(names)];
  }

  private readEnv(key: string): string | undefined {
    const value = this.config.get<string>(key)?.trim();
    return value ? value : undefined;
  }
}
