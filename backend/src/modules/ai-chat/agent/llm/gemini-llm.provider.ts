import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DEFAULT_GEMINI_MODEL,
  buildModelsToTry,
} from '../../../ai/gemini/gemini.constants';
import type {
  ChatModelOptions,
  LlmProvider,
  LlmRole,
} from './llm-provider.interface';

export const DEFAULT_AGENT_MODEL = 'gemini-2.5-flash';
const MAX_MODELS_PER_ROLE = 3;

@Injectable()
export class GeminiLlmProvider implements LlmProvider {
  readonly name = 'gemini';

  constructor(private readonly config: ConfigService) {}

  createChatModels(
    role: LlmRole,
    options: ChatModelOptions = {},
  ): BaseChatModel[] {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY').trim();
    return this.resolveModelNames(role).map(
      model =>
        new ChatGoogleGenerativeAI({
          model,
          apiKey,
          temperature: options.temperature,
          maxRetries: 1,
        }),
    );
  }

  resolveModelNames(role: LlmRole): string[] {
    const primary =
      role === 'agent'
        ? (this.readEnv('LLM_AGENT_MODEL') ?? DEFAULT_AGENT_MODEL)
        : (this.readEnv('LLM_LIGHT_MODEL') ??
          this.readEnv('GEMINI_MODEL') ??
          DEFAULT_GEMINI_MODEL);
    return buildModelsToTry(primary)
      .filter(name => name === primary || name.startsWith('gemini-'))
      .slice(0, MAX_MODELS_PER_ROLE);
  }

  private readEnv(key: string): string | undefined {
    const value = this.config.get<string>(key)?.trim();
    return value ? value : undefined;
  }
}
