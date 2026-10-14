import { Annotation, MessagesAnnotation } from '@langchain/langgraph';

import type { UserContext } from '../user-context.service';
import type { ChatIntent, ChatReferencedItem } from './chat.types';

export const MAX_TOOL_ROUNDS = 4;

function replace<T>(_current: T, next: T): T {
  return next;
}

export const ChatState = Annotation.Root({
  ...MessagesAnnotation.spec,
  question: Annotation<string>({ reducer: replace, default: () => '' }),
  userContext: Annotation<UserContext | null>({
    reducer: replace,
    default: () => null,
  }),
  summary: Annotation<string | null>({ reducer: replace, default: () => null }),
  intent: Annotation<ChatIntent>({
    reducer: replace,
    default: () => 'general',
  }),
  entityHint: Annotation<string | null>({
    reducer: replace,
    default: () => null,
  }),
  toolRounds: Annotation<number>({ reducer: replace, default: () => 0 }),
  suggestions: Annotation<string[]>({ reducer: replace, default: () => [] }),
  referencedItems: Annotation<ChatReferencedItem[]>({
    reducer: replace,
    default: () => [],
  }),
});

export type ChatStateType = typeof ChatState.State;
export type ChatStateUpdate = typeof ChatState.Update;
