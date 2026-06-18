import type { LiveChatAuthorRecord } from './live-chat.records';

export type VideoCallRecord = {
  id: string;
  roomId: string;
  hostId: string;
  status: string;
  scheduledFor: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  providerRoomName: string | null;
  createdAt: Date;
  updatedAt: Date;
  host: LiveChatAuthorRecord;
};
