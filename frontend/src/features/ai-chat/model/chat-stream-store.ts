import { create } from 'zustand';

import type { ChatActionPayload, ChatIntent, ChatMessage } from '../api/ai-chat.types';

export type SessionStreamState = {
  optimisticMessages: ChatMessage[];
  isStreaming: boolean;
  suggestions: string[];
  intent: ChatIntent | null;
  pendingAction: ChatActionPayload | null;
};

type ChatStreamStore = {
  sessions: Record<string, SessionStreamState>;
  initSession: (sessionId: string) => void;
  setStreaming: (sessionId: string, isStreaming: boolean) => void;
  setOptimisticMessages: (sessionId: string, messages: ChatMessage[]) => void;
  updateOptimisticMessage: (
    sessionId: string,
    messageId: string,
    updater: (msg: ChatMessage) => ChatMessage,
  ) => void;
  setSuggestions: (sessionId: string, suggestions: string[]) => void;
  setIntent: (sessionId: string, intent: ChatIntent) => void;
  setPendingAction: (sessionId: string, action: ChatActionPayload | null) => void;
  clearSession: (sessionId: string) => void;
};

export const EMPTY_SESSION: SessionStreamState = {
  optimisticMessages: [],
  isStreaming: false,
  suggestions: [],
  intent: null,
  pendingAction: null,
};

export const useChatStreamStore = create<ChatStreamStore>(set => ({
  sessions: {},

  initSession: (sessionId) =>
    set(state => {
      if (state.sessions[sessionId]) return state;
      return {
        sessions: { ...state.sessions, [sessionId]: EMPTY_SESSION },
      };
    }),

  setStreaming: (sessionId, isStreaming) =>
    set(state => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...(state.sessions[sessionId] ?? EMPTY_SESSION), isStreaming },
      },
    })),

  setOptimisticMessages: (sessionId, optimisticMessages) =>
    set(state => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...(state.sessions[sessionId] ?? EMPTY_SESSION), optimisticMessages },
      },
    })),

  updateOptimisticMessage: (sessionId, messageId, updater) =>
    set(state => {
      const session = state.sessions[sessionId] ?? EMPTY_SESSION;
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...session,
            optimisticMessages: session.optimisticMessages.map(m =>
              m.id === messageId ? updater(m) : m,
            ),
          },
        },
      };
    }),

  setSuggestions: (sessionId, suggestions) =>
    set(state => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...(state.sessions[sessionId] ?? EMPTY_SESSION), suggestions },
      },
    })),

  setIntent: (sessionId, intent) =>
    set(state => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...(state.sessions[sessionId] ?? EMPTY_SESSION), intent },
      },
    })),

  setPendingAction: (sessionId, pendingAction) =>
    set(state => ({
      sessions: {
        ...state.sessions,
        [sessionId]: { ...(state.sessions[sessionId] ?? EMPTY_SESSION), pendingAction },
      },
    })),

  clearSession: (sessionId) =>
    set(state => ({
      sessions: { ...state.sessions, [sessionId]: EMPTY_SESSION },
    })),
}));

const controllers = new Map<string, AbortController>();

export function getStreamController(sessionId: string): AbortController | undefined {
  return controllers.get(sessionId);
}

export function setStreamController(sessionId: string, controller: AbortController): void {
  controllers.set(sessionId, controller);
}

export function deleteStreamController(sessionId: string): void {
  controllers.delete(sessionId);
}
