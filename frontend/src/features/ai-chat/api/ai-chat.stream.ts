import { getStoredAuthToken } from '@/shared/lib/auth-token';

import { AI_CHAT_ROUTES } from './ai-chat.routes';
import type { StreamEvent } from './ai-chat.types';

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  if (!base) throw new Error('VITE_API_URL is not set');
  return base.replace(/\/$/, '');
}

export async function streamChatMessage({
  sessionId,
  message,
  signal,
  onToken,
  onDone,
  onError,
}: {
  sessionId: string;
  message: string;
  signal: AbortSignal;
  onToken: (token: string) => void;
  onDone: (messageId: string) => void;
  onError: (message: string) => void;
}): Promise<void> {
  const token = getStoredAuthToken();
  const url = `${getApiBaseUrl()}${AI_CHAT_ROUTES.stream(sessionId)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!res.ok || !res.body) {
    onError('Failed to connect to AI');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6)) as StreamEvent;
        if (event.type === 'token') onToken(event.content);
        else if (event.type === 'done') onDone(event.messageId);
        else if (event.type === 'error') {
          onError(event.message);
        }
      } catch {
      }
    }
  }
}
