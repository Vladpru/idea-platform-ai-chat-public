import { toLiveChatAuthorResponse } from './live-chat.mapper';
import type { VideoCallDto } from './types/video-call.types';
import type { VideoCallRecord } from './video-call.records';

function toIsoString(date: Date): string {
  return date.toISOString();
}

function toNullableIsoString(date: Date | null): string | null {
  return date ? toIsoString(date) : null;
}

export function toVideoCallResponse(call: VideoCallRecord): VideoCallDto {
  return {
    id: call.id,
    roomId: call.roomId,
    host: toLiveChatAuthorResponse(call.host),
    status: call.status as VideoCallDto['status'],
    scheduledFor: toNullableIsoString(call.scheduledFor),
    startedAt: toNullableIsoString(call.startedAt),
    endedAt: toNullableIsoString(call.endedAt),
    createdAt: toIsoString(call.createdAt),
  };
}

export function buildProviderRoomName(videoCallId: string): string {
  return `vc-${videoCallId}`;
}
