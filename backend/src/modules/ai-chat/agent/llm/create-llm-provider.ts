import type { ConfigService } from '@nestjs/config';

import { GeminiLlmProvider } from './gemini-llm.provider';
import type { LlmProvider } from './llm-provider.interface';

export function createLlmProvider(config: ConfigService): LlmProvider {
  const name = config.get<string>('LLM_PROVIDER')?.trim() || 'gemini';
  if (name === 'gemini') {
    return new GeminiLlmProvider(config);
  }
  throw new Error(`Unsupported LLM_PROVIDER "${name}". Supported: gemini`);
}
