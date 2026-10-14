import type { RunnableConfig } from '@langchain/core/runnables';

import {
  CHAT_CONTEXT_KEY,
  type ChatRunContext,
  type ChatSideEvent,
} from '../chat.types';
import { SourceCollector } from '../source-collector';

export function createTestContext(overrides: Partial<ChatRunContext> = {}): {
  config: RunnableConfig;
  context: ChatRunContext;
  events: ChatSideEvent[];
} {
  const events: ChatSideEvent[] = [];
  const context: ChatRunContext = {
    sessionId: 'session-1',
    userId: 'user-1',
    role: 'MEMBER',
    pageContext: null,
    emit: event => events.push(event),
    sources: new SourceCollector(),
    ...overrides,
  };
  return {
    config: { configurable: { [CHAT_CONTEXT_KEY]: context } },
    context,
    events,
  };
}
