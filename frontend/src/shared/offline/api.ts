import type { AxiosRequestConfig } from 'axios';
import type { Socket } from 'socket.io-client';

import { api } from '@/shared/api/http';

function ifMatch(baseVersion: number): AxiosRequestConfig {
  return { headers: { 'If-Match': `"${baseVersion}"` } };
}

export interface ServerVersioned {
  id: string;
  version: number;
}

export interface ServerIdea extends ServerVersioned {
  status: string;
  stage: string | null;
  title: string | null;
  description: string | null;
  [key: string]: unknown;
}

export interface ServerProblem extends ServerVersioned {
  status: string;
  stage: string | null;
  title: string;
  description: string;
  [key: string]: unknown;
}

export interface ServerChatMessage {
  id: string;
  roomId: string;
  clientMessageId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface Paginated<T> {
  data: T[];
  meta: Record<string, unknown>;
}

export interface CreateIdeaBody {
  id: string;
  isPublished: boolean;
  title?: string;
  description?: string;
  stage?: string;
  problemIds?: string[];
  tagIds?: string[];
  tagLabels?: string[];
}

export interface UpdateIdeaBody {
  title?: string;
  description?: string;
  stage?: string;
  problemIds?: string[];
  tagIds?: string[];
  tagLabels?: string[];
}

export async function createIdea(body: CreateIdeaBody): Promise<ServerIdea> {
  const { data } = await api.post<ServerIdea>('/ideas', body);
  return data;
}

export async function updateIdeaDraft(
  serverId: string,
  baseVersion: number,
  patch: UpdateIdeaBody,
): Promise<ServerIdea> {
  const { data } = await api.patch<ServerIdea>(
    `/ideas/${serverId}`,
    patch,
    ifMatch(baseVersion),
  );
  return data;
}

export async function updatePublishedIdea(
  serverId: string,
  baseVersion: number,
  patch: UpdateIdeaBody,
): Promise<ServerIdea> {
  const { data } = await api.patch<ServerIdea>(
    `/ideas/${serverId}/publish`,
    patch,
    ifMatch(baseVersion),
  );
  return data;
}

export interface IdeasFeedParams {
  page?: number;
  limit?: number;
  stage?: string;
  sort?: 'newest' | 'oldest' | 'views' | 'likes' | 'comments';
}

export async function fetchIdeasFeed(
  params?: IdeasFeedParams,
): Promise<Paginated<ServerIdea>> {
  const { data } = await api.get<Paginated<ServerIdea>>('/ideas', { params });
  return data;
}

export async function fetchIdeaById(serverId: string): Promise<ServerIdea> {
  const { data } = await api.get<ServerIdea>(`/ideas/${serverId}`);
  return data;
}

export async function uploadIdeaMainImage(
  serverId: string,
  file: File,
): Promise<void> {
  const body = new FormData();
  body.append('file', file);
  await api.put(`/ideas/${serverId}/main-image`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function uploadIdeaAttachment(
  serverId: string,
  file: File,
): Promise<void> {
  const body = new FormData();
  body.append('file', file);
  await api.post(`/ideas/${serverId}/media`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function publishIdea(
  serverId: string,
  baseVersion: number,
): Promise<ServerIdea> {
  const { data } = await api.post<ServerIdea>(
    `/ideas/${serverId}/publish`,
    undefined,
    ifMatch(baseVersion),
  );
  return data;
}

export interface CreateProblemBody {
  id: string;
  isPublished: boolean;
  title?: string;
  description?: string;
  stage?: string;
  valueProposition?: string;
  costBenefit?: string;
  category?: string;
  impact?: string;
  ideaIds?: string[];
  tagIds?: string[];
  tagLabels?: string[];
}

export interface UpdateProblemBody {
  title?: string;
  description?: string;
  stage?: string;
  valueProposition?: string;
  costBenefit?: string;
  category?: string;
  impact?: string;
  ideaIds?: string[];
  tagIds?: string[];
  tagLabels?: string[];
}

export async function createProblem(
  body: CreateProblemBody,
): Promise<ServerProblem> {
  const { data } = await api.post<ServerProblem>('/problems', body);
  return data;
}

export async function updateProblem(
  serverId: string,
  baseVersion: number,
  patch: UpdateProblemBody,
): Promise<ServerProblem> {
  const { data } = await api.patch<ServerProblem>(
    `/problems/${serverId}`,
    patch,
    ifMatch(baseVersion),
  );
  return data;
}

export async function uploadProblemAttachment(
  serverId: string,
  file: File,
): Promise<void> {
  const body = new FormData();
  body.append('file', file);
  await api.post(`/problems/${serverId}/media`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export interface ProblemsFeedParams {
  page?: number;
  limit?: number;
  stage?: string;
  sort?: string;
}

export async function fetchProblemsFeed(
  params?: ProblemsFeedParams,
): Promise<Paginated<ServerProblem>> {
  const { data } = await api.get<Paginated<ServerProblem>>('/problems', {
    params,
  });
  return data;
}

export async function fetchProblemById(
  serverId: string,
): Promise<ServerProblem> {
  const { data } = await api.get<ServerProblem>(`/problems/${serverId}`);
  return data;
}

export interface ChatMessagesPage {
  data: ServerChatMessage[];
  meta: { limit: number; hasOlder: boolean; nextCursor: string | null };
}

export async function fetchRooms<T = unknown>(): Promise<T> {
  const { data } = await api.get<T>('/live-chats');
  return data;
}

export async function fetchRoomMessages(
  roomId: string,
  params?: { limit?: number; cursor?: string },
): Promise<ChatMessagesPage> {
  const { data } = await api.get<ChatMessagesPage>(
    `/live-chats/${roomId}/messages`,
    { params },
  );
  return data;
}

export interface SendChatMessageBody {
  roomId: string;
  clientMessageId: string;
  content: string;
}

export type SendChatMessageAck =
  | { ok: true; message: ServerChatMessage }
  | { ok: false; error: string };

export function sendChatMessage(
  socket: Socket,
  body: SendChatMessageBody,
  timeoutMs = 10_000,
): Promise<SendChatMessageAck> {
  return socket
    .timeout(timeoutMs)
    .emitWithAck('send_message', body) as Promise<SendChatMessageAck>;
}
