import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { type Server, createServer } from 'http';
import type { AddressInfo } from 'net';

import { messageText } from '../lib/messages';
import { withModelFallbacks } from './llm-provider.interface';
import {
  DEFAULT_OPENROUTER_MODEL,
  OpenRouterLlmProvider,
} from './openrouter-llm.provider';

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

const withKey = (values: Record<string, string | undefined> = {}) =>
  configWith({ OPENROUTER_API_KEY: 'k', ...values });

describe('OpenRouterLlmProvider', () => {
  it('is named openrouter', () => {
    expect(new OpenRouterLlmProvider(withKey()).name).toBe('openrouter');
  });

  it('defaults both roles to the nemotron free model', () => {
    const provider = new OpenRouterLlmProvider(withKey());
    expect(DEFAULT_OPENROUTER_MODEL).toBe(
      'nvidia/nemotron-3-super-120b-a12b:free',
    );
    expect(provider.resolveModelNames('agent')).toEqual([
      DEFAULT_OPENROUTER_MODEL,
    ]);
    expect(provider.resolveModelNames('light')).toEqual([
      DEFAULT_OPENROUTER_MODEL,
    ]);
  });

  it('reads the agent role from LLM_AGENT_MODEL', () => {
    const provider = new OpenRouterLlmProvider(
      withKey({ LLM_AGENT_MODEL: 'vendor/model-a:free' }),
    );
    expect(provider.resolveModelNames('agent')).toEqual([
      'vendor/model-a:free',
    ]);
  });

  it('lets the light role fall back to the agent models, and override them', () => {
    const inherited = new OpenRouterLlmProvider(
      withKey({ LLM_AGENT_MODEL: 'vendor/a,vendor/b' }),
    );
    expect(inherited.resolveModelNames('light')).toEqual([
      'vendor/a',
      'vendor/b',
    ]);

    const overridden = new OpenRouterLlmProvider(
      withKey({
        LLM_AGENT_MODEL: 'vendor/a,vendor/b',
        LLM_LIGHT_MODEL: 'vendor/light',
      }),
    );
    expect(overridden.resolveModelNames('light')).toEqual(['vendor/light']);
  });

  it('splits comma separated models, trims them, drops blanks and duplicates', () => {
    const provider = new OpenRouterLlmProvider(
      withKey({ LLM_AGENT_MODEL: ' vendor/a , ,vendor/b,vendor/a ,' }),
    );
    expect(provider.resolveModelNames('agent')).toEqual([
      'vendor/a',
      'vendor/b',
    ]);
  });

  it('caps the model list at 3 per role', () => {
    const provider = new OpenRouterLlmProvider(
      withKey({ LLM_AGENT_MODEL: 'm1,m2,m3,m4,m5' }),
    );
    expect(provider.resolveModelNames('agent')).toEqual(['m1', 'm2', 'm3']);
  });

  it('treats a blank LLM_AGENT_MODEL as unset', () => {
    const provider = new OpenRouterLlmProvider(
      withKey({ LLM_AGENT_MODEL: '  ' }),
    );
    expect(provider.resolveModelNames('agent')).toEqual([
      DEFAULT_OPENROUTER_MODEL,
    ]);
  });

  it('creates one ChatOpenAI per model with temperature, retries and the default base URL', () => {
    const provider = new OpenRouterLlmProvider(
      withKey({ LLM_AGENT_MODEL: 'vendor/a,vendor/b' }),
    );
    const models = provider.createChatModels('agent', { temperature: 0.3 });

    expect(models).toHaveLength(2);
    for (const model of models) {
      expect(model).toBeInstanceOf(ChatOpenAI);
    }
    const first = models[0] as ChatOpenAI;
    expect(first.model).toBe('vendor/a');
    expect(first.temperature).toBe(0.3);
    expect(
      (first as unknown as { caller: { maxRetries: number } }).caller
        .maxRetries,
    ).toBe(1);
    expect(first.clientConfig.baseURL).toBe('https://openrouter.ai/api/v1');
  });

  it('uses OPENROUTER_BASE_URL when it is set', () => {
    const provider = new OpenRouterLlmProvider(
      withKey({ OPENROUTER_BASE_URL: 'http://localhost:9999/v1' }),
    );
    const [model] = provider.createChatModels('light') as ChatOpenAI[];
    expect(model.clientConfig.baseURL).toBe('http://localhost:9999/v1');
  });

  it('throws when OPENROUTER_API_KEY is missing', () => {
    const provider = new OpenRouterLlmProvider(configWith({}));
    expect(() => provider.createChatModels('agent')).toThrow(
      'missing OPENROUTER_API_KEY',
    );
  });
});

describe('OpenRouterLlmProvider against a local OpenAI-compatible server', () => {
  let server: Server;
  let baseUrl: string;
  let requestedModels: string[];

  beforeAll(async () => {
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const body = JSON.parse(Buffer.concat(chunks).toString()) as {
          model: string;
        };
        requestedModels.push(body.model);
        if (body.model === 'vendor/limited') {
          res.writeHead(429, {
            'content-type': 'application/json',
            'retry-after-ms': '1',
          });
          res.end(
            JSON.stringify({
              error: {
                message: 'temporarily rate-limited upstream',
                code: 429,
              },
            }),
          );
          return;
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            id: 'cmpl-1',
            object: 'chat.completion',
            created: 0,
            model: body.model,
            choices: [
              {
                index: 0,
                finish_reason: 'stop',
                message: {
                  role: 'assistant',
                  content: 'visible answer',
                  reasoning: 'private chain of thought',
                },
              },
            ],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          }),
        );
      });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  beforeEach(() => {
    requestedModels = [];
  });

  it('falls back to the next model when the first one answers 429', async () => {
    const provider = new OpenRouterLlmProvider(
      withKey({
        OPENROUTER_BASE_URL: baseUrl,
        LLM_AGENT_MODEL: 'vendor/limited,vendor/healthy',
      }),
    );
    const runnable = withModelFallbacks(
      provider.createChatModels('agent'),
      model => model,
    );

    const result = await runnable.invoke('hello');

    expect(messageText(result.content)).toBe('visible answer');
    expect(requestedModels).toContain('vendor/limited');
    expect(requestedModels.at(-1)).toBe('vendor/healthy');
  });

  it('keeps the reasoning field out of the message content', async () => {
    const provider = new OpenRouterLlmProvider(
      withKey({
        OPENROUTER_BASE_URL: baseUrl,
        LLM_AGENT_MODEL: 'vendor/healthy',
      }),
    );
    const [model] = provider.createChatModels('agent');

    const result = await model.invoke('hello');

    expect(messageText(result.content)).toBe('visible answer');
    expect(JSON.stringify(result.content)).not.toContain('chain of thought');
  });
});
