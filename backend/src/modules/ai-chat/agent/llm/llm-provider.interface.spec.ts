import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { RunnableLambda } from '@langchain/core/runnables';

import { withModelFallbacks } from './llm-provider.interface';

const fakeModel = (name: string) => ({ name }) as unknown as BaseChatModel;

describe('withModelFallbacks', () => {
  it('falls back to the next model when the primary fails', async () => {
    const runnable = withModelFallbacks(
      [fakeModel('a'), fakeModel('b')],
      model =>
        RunnableLambda.from((input: string) => {
          if ((model as unknown as { name: string }).name === 'a')
            throw new Error('down');
          return `${input}-b`;
        }),
    );
    await expect(runnable.invoke('x')).resolves.toBe('x-b');
  });

  it('returns the primary runnable when there is only one model', async () => {
    const runnable = withModelFallbacks([fakeModel('a')], () =>
      RunnableLambda.from((input: string) => `${input}-a`),
    );
    await expect(runnable.invoke('x')).resolves.toBe('x-a');
  });

  it('throws when no models are configured', () => {
    expect(() =>
      withModelFallbacks([], () => RunnableLambda.from(() => 'x')),
    ).toThrow('No chat models configured');
  });
});
