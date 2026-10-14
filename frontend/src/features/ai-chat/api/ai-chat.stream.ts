import axios from 'axios';

import type { PageContext } from '@/shared/model/page-context-store';

import { AI_CHAT_ROUTES } from './ai-chat.routes';
import type { DraftProposal, StreamEvent } from './ai-chat.types';

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  if (!base) throw new Error('VITE_API_URL is not set');
  return base.replace(/\/$/, '');
}

function parseLines(lines: string[], callbacks: {
  onToken: (token: string) => void;
  onDone: (messageId: string) => void;
  onError: (message: string) => void;
  onSuggestions?: (suggestions: string[]) => void;
  onIntent?: (intent: string, entityHint: string | null) => void;
  onFieldAction?: (field: 'tags' | 'linked_problems', values: string[]) => void;
  onDraftProposal?: (proposal: DraftProposal) => void;
}) {
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    try {
      const event = JSON.parse(line.slice(6)) as StreamEvent;
      if (event.type === 'token') callbacks.onToken(event.content);
      else if (event.type === 'done') callbacks.onDone(event.messageId);
      else if (event.type === 'error') callbacks.onError(event.message);
      else if (event.type === 'suggestions') callbacks.onSuggestions?.(event.suggestions);
      else if (event.type === 'intent') callbacks.onIntent?.(event.intent, event.entityHint);
      else if (event.type === 'field_action') callbacks.onFieldAction?.(event.field, event.values);
      else if (event.type === 'draft_proposal') callbacks.onDraftProposal?.({ draftType: event.draftType, title: event.title, description: event.description, tags: event.tags });
    } catch {}
  }
}

export async function streamChatMessage({
  sessionId,
  message,
  pageContext,
  signal,
  onToken,
  onDone,
  onError,
  onSuggestions,
  onIntent,
  onFieldAction,
  onDraftProposal,
}: {
  sessionId: string;
  message: string;
  pageContext?: PageContext;
  signal: AbortSignal;
  onToken: (token: string) => void;
  onDone: (messageId: string) => void;
  onError: (message: string) => void;
  onSuggestions?: (suggestions: string[]) => void;
  onIntent?: (intent: string, entityHint: string | null) => void;
  onFieldAction?: (field: 'tags' | 'linked_problems', values: string[]) => void;
  onDraftProposal?: (proposal: DraftProposal) => void;
}): Promise<void> {
  const url = `${getApiBaseUrl()}${AI_CHAT_ROUTES.stream(sessionId)}`;
  let processedLength = 0;
  let buffer = '';

  try {
    await axios.post(url, { message, pageContext: pageContext ?? null }, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
      responseType: 'text',
      signal,
      onDownloadProgress: (progressEvent) => {
        const raw = progressEvent.event?.target?.responseText as string | undefined;
        if (!raw) return;

        const newChunk = raw.slice(processedLength);
        processedLength = raw.length;

        buffer += newChunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        parseLines(lines, { onToken, onDone, onError, onSuggestions, onIntent, onFieldAction, onDraftProposal });
      },
    });

    if (buffer) {
      const lines = buffer.split('\n');
      parseLines(lines, { onToken, onDone, onError, onSuggestions, onIntent, onFieldAction, onDraftProposal });
    }
  } catch (err) {
    if (axios.isCancel(err)) return;
    onError('Failed to connect to AI');
  }
}
