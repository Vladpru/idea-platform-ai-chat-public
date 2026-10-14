export function messageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map(part => (isTextPart(part) ? part.text : '')).join('');
}

export function toolCallCount(message: unknown): number {
  const calls = (message as { tool_calls?: unknown } | undefined)?.tool_calls;
  return Array.isArray(calls) ? calls.length : 0;
}

export function toolCallNames(messages: unknown[]): string[] {
  return messages.flatMap(message => {
    const calls = (message as { tool_calls?: { name?: unknown }[] }).tool_calls;
    return Array.isArray(calls)
      ? calls.map(call => (typeof call.name === 'string' ? call.name : ''))
      : [];
  });
}

function isTextPart(part: unknown): part is { type: 'text'; text: string } {
  return (
    typeof part === 'object' &&
    part !== null &&
    (part as { type?: unknown }).type === 'text' &&
    typeof (part as { text?: unknown }).text === 'string'
  );
}
