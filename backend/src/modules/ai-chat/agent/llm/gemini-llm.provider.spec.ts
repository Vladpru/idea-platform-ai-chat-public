import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ConfigService } from '@nestjs/config';

import { createLlmProvider } from './create-llm-provider';
import { GeminiLlmProvider } from './gemini-llm.provider';

function configWith(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      const value = values[key];
      if (value === undefined) throw new Error(`missing ${key}`);
      return value;
    },
  } as unknown as ConfigService;
}

describe('GeminiLlmProvider', () => {
  it('uses gemini-2.5-flash for the agent role by default, with Gemini-only fallbacks capped at 3', () => {
    const provider = new GeminiLlmProvider(configWith({ GEMINI_API_KEY: 'k' }));
    expect(provider.resolveModelNames('agent')).toEqual([
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite',
    ]);
  });

  it('uses GEMINI_MODEL for the light role when LLM_LIGHT_MODEL is not set', () => {
    const provider = new GeminiLlmProvider(
      configWith({
        GEMINI_API_KEY: 'k',
        GEMINI_MODEL: 'gemini-2.5-flash-lite',
      }),
    );
    expect(provider.resolveModelNames('light')).toEqual([
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.0-flash-lite',
    ]);
  });

  it('prefers LLM_AGENT_MODEL and LLM_LIGHT_MODEL overrides', () => {
    const provider = new GeminiLlmProvider(
      configWith({
        GEMINI_API_KEY: 'k',
        LLM_AGENT_MODEL: 'gemini-3.0-flash',
        LLM_LIGHT_MODEL: 'gemini-3.1-flash-lite',
        GEMINI_MODEL: 'gemini-2.5-flash-lite',
      }),
    );
    expect(provider.resolveModelNames('agent')[0]).toBe('gemini-3.0-flash');
    expect(provider.resolveModelNames('light')[0]).toBe(
      'gemini-3.1-flash-lite',
    );
  });

  it('never includes gemma models', () => {
    const provider = new GeminiLlmProvider(configWith({ GEMINI_API_KEY: 'k' }));
    for (const role of ['agent', 'light'] as const) {
      expect(
        provider.resolveModelNames(role).some(name => name.startsWith('gemma')),
      ).toBe(false);
    }
  });

  it('creates one ChatGoogleGenerativeAI per resolved model', () => {
    const provider = new GeminiLlmProvider(configWith({ GEMINI_API_KEY: 'k' }));
    const models = provider.createChatModels('agent', { temperature: 0.3 });
    expect(models).toHaveLength(3);
    expect(models.every(model => model instanceof ChatGoogleGenerativeAI)).toBe(
      true,
    );
  });

  it('throws when GEMINI_API_KEY is missing', () => {
    const provider = new GeminiLlmProvider(configWith({}));
    expect(() => provider.createChatModels('light')).toThrow(
      'missing GEMINI_API_KEY',
    );
  });
});

describe('createLlmProvider', () => {
  it('returns the Gemini provider by default', () => {
    expect(createLlmProvider(configWith({})).name).toBe('gemini');
  });

  it('throws on an unsupported provider', () => {
    expect(() =>
      createLlmProvider(configWith({ LLM_PROVIDER: 'claude' })),
    ).toThrow('Unsupported LLM_PROVIDER "claude". Supported: gemini');
  });
});
