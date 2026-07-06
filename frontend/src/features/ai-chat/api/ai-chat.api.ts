import { api } from '@/shared/api/http';

import { AI_CHAT_ROUTES } from './ai-chat.routes';
import type { ChatMessage, ChatSession, KbStats, NudgeResponse } from './ai-chat.types';

export async function fetchSessions(): Promise<ChatSession[]> {
  const { data } = await api.get<ChatSession[]>(AI_CHAT_ROUTES.sessions);
  return data;
}

export async function createSession(): Promise<ChatSession> {
  const { data } = await api.post<ChatSession>(AI_CHAT_ROUTES.sessions);
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(AI_CHAT_ROUTES.session(id));
}

export async function fetchSessionMessages(id: string): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(AI_CHAT_ROUTES.messages(id));
  return data;
}

export async function fetchKbStats(): Promise<KbStats> {
  const { data } = await api.get<KbStats>(AI_CHAT_ROUTES.kbStats);
  return data;
}

export async function fetchNudge(): Promise<NudgeResponse> {
  const { data } = await api.get<NudgeResponse>(AI_CHAT_ROUTES.nudge);
  return data;
}
