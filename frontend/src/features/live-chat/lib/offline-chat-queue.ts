import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import {
  db,
  type LocalChatMessage,
  type SyncStatus,
} from '@/shared/offline/db';

import type { LiveChatMessageDto } from '../api/live-chat-api.types';

function dtoToLocalMessage(
  dto: LiveChatMessageDto,
  syncStatus: SyncStatus,
): LocalChatMessage {
  return {
    localId: dto.clientMessageId,
    serverId: syncStatus === 'synced' ? dto.id : null,
    syncStatus,
    version: 0,
    updatedAt: dto.createdAt,
    deleted: false,
    roomId: dto.roomId,
    clientMessageId: dto.clientMessageId,
    authorId: dto.author.id,
    content: dto.content,
    createdAt: dto.createdAt,
    snapshot: dto as unknown as Record<string, unknown>,
  };
}

export function localMessageToDto(row: LocalChatMessage): LiveChatMessageDto {
  return row.snapshot as unknown as LiveChatMessageDto;
}

export async function saveOutgoingMessage(
  dto: LiveChatMessageDto,
): Promise<void> {
  await db.chat_messages.put(dtoToLocalMessage(dto, 'pending_socket'));
}

export async function saveSyncedMessage(
  dto: LiveChatMessageDto,
): Promise<void> {
  await db.chat_messages.put(dtoToLocalMessage(dto, 'synced'));
}

export async function saveSyncedMessages(
  dtos: LiveChatMessageDto[],
): Promise<void> {
  await db.chat_messages.bulkPut(
    dtos.map(dto => dtoToLocalMessage(dto, 'synced')),
  );
}

export async function getPendingMessages(
  roomId: string,
): Promise<LocalChatMessage[]> {
  const rows = await db.chat_messages
    .where('roomId')
    .equals(roomId)
    .filter(message => message.syncStatus === 'pending_socket')
    .sortBy('createdAt');
  return rows;
}

function getRoomMessages(roomId: string): Promise<LocalChatMessage[]> {
  return db.chat_messages.where('roomId').equals(roomId).sortBy('createdAt');
}

export function mergeChatMessages(
  ...lists: LiveChatMessageDto[][]
): LiveChatMessageDto[] {
  const byKey = new Map<string, LiveChatMessageDto>();
  for (const list of lists) {
    for (const message of list) {
      const key = message.clientMessageId || message.id;
      if (!byKey.has(key)) byKey.set(key, message);
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export function useRoomChatMessages(roomId: string): LiveChatMessageDto[] {
  const rows = useLiveQuery(() => getRoomMessages(roomId), [roomId]);
  return useMemo(() => (rows ?? []).map(localMessageToDto), [rows]);
}
