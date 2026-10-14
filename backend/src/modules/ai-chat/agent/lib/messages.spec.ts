import { AIMessage } from '@langchain/core/messages';

import { messageText, toolCallCount, toolCallNames } from './messages';

describe('messageText', () => {
  it('returns string content as is', () => {
    expect(messageText('hello')).toBe('hello');
  });

  it('joins text parts and ignores other parts', () => {
    expect(
      messageText([
        { type: 'text', text: 'a' },
        { type: 'image_url', image_url: 'x' },
        { type: 'text', text: 'b' },
      ]),
    ).toBe('ab');
  });

  it('returns empty string for unknown content', () => {
    expect(messageText(undefined)).toBe('');
    expect(messageText(42)).toBe('');
  });
});

describe('toolCallCount / toolCallNames', () => {
  it('counts tool calls on an AI message', () => {
    const message = new AIMessage({
      content: '',
      tool_calls: [
        { id: '1', name: 'search_knowledge', args: {} },
        { id: '2', name: 'get_entity', args: {} },
      ],
    });
    expect(toolCallCount(message)).toBe(2);
    expect(toolCallNames([message, new AIMessage('done')])).toEqual([
      'search_knowledge',
      'get_entity',
    ]);
  });

  it('returns 0 for messages without tool calls', () => {
    expect(toolCallCount(new AIMessage('hi'))).toBe(0);
    expect(toolCallCount(undefined)).toBe(0);
  });
});
