import type { LiveChatAuthorDto } from './live-chat.types';

export type VideoCallStatusDto = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export type VideoCallDto = {
  id: string;
  roomId: string;
  host: LiveChatAuthorDto;
  status: VideoCallStatusDto;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type VideoCallListResponse = {
  activeCall: VideoCallDto | null;
  upcomingCalls: VideoCallDto[];
};

export type JoinVideoCallResponse = {
  token: string;
  livekitUrl: string;
  call: VideoCallDto;
};

export type VideoCallLifecyclePayload = {
  callId: string;
  roomId: string;
};
