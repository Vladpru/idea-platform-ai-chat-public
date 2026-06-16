import type {
  LiveChatRoomDto,
  VideoCallDto,
  VideoCallLifecyclePayload,
  VideoCallListResponse,
} from '@/features/live-chat/api/live-chat-api.types';

function sortUpcomingCalls(calls: VideoCallDto[]): VideoCallDto[] {
  return [...calls].sort((left, right) => {
    const leftTime = left.scheduledFor
      ? Date.parse(left.scheduledFor)
      : Number.MAX_SAFE_INTEGER;
    const rightTime = right.scheduledFor
      ? Date.parse(right.scheduledFor)
      : Number.MAX_SAFE_INTEGER;

    return leftTime - rightTime;
  });
}

function createEmptyVideoCallCache(): VideoCallListResponse {
  return {
    activeCall: null,
    upcomingCalls: [],
  };
}

export function applyCallScheduled(
  cache: VideoCallListResponse | undefined,
  call: VideoCallDto,
): VideoCallListResponse {
  const current = cache ?? createEmptyVideoCallCache();

  if (current.upcomingCalls.some(existing => existing.id === call.id)) {
    return current;
  }

  return {
    ...current,
    upcomingCalls: sortUpcomingCalls([...current.upcomingCalls, call]),
  };
}

export function applyCallStarted(
  cache: VideoCallListResponse | undefined,
  call: VideoCallDto,
): VideoCallListResponse {
  const current = cache ?? createEmptyVideoCallCache();

  return {
    activeCall: call,
    upcomingCalls: current.upcomingCalls.filter(
      existing => existing.id !== call.id,
    ),
  };
}

export function applyCallEnded(
  cache: VideoCallListResponse | undefined,
  payload: VideoCallLifecyclePayload,
): VideoCallListResponse {
  const current = cache ?? createEmptyVideoCallCache();

  if (current.activeCall?.id !== payload.callId) {
    return current;
  }

  return {
    ...current,
    activeCall: null,
  };
}

export function applyCallCancelled(
  cache: VideoCallListResponse | undefined,
  payload: VideoCallLifecyclePayload,
): VideoCallListResponse {
  const current = cache ?? createEmptyVideoCallCache();

  return {
    ...current,
    upcomingCalls: current.upcomingCalls.filter(
      existing => existing.id !== payload.callId,
    ),
  };
}

function patchRoomArray(
  arr: LiveChatRoomDto[],
  roomId: string,
  activeCall: VideoCallDto | null,
): LiveChatRoomDto[] {
  return arr.map(room =>
    room.id === roomId ? { ...room, activeCall } : room,
  );
}

export function patchRoomActiveCallInList(
  rooms: LiveChatRoomDto[] | undefined,
  roomId: string,
  activeCall: VideoCallDto | null,
): LiveChatRoomDto[] | undefined {
  if (!rooms) return rooms;

  if (Array.isArray(rooms)) {
    return patchRoomArray(rooms, roomId, activeCall);
  }

  const asObj = rooms as unknown as Record<string, unknown>;

  if ('pages' in asObj && Array.isArray(asObj.pages)) {
    return {
      ...asObj,
      pages: (asObj.pages as Array<Record<string, unknown>>).map(page => {
        if (!Array.isArray(page.data)) return page;
        return {
          ...page,
          data: patchRoomArray(page.data as LiveChatRoomDto[], roomId, activeCall),
        };
      }),
    } as unknown as LiveChatRoomDto[];
  }

  if ('data' in asObj && Array.isArray(asObj.data)) {
    return {
      ...asObj,
      data: patchRoomArray(asObj.data as LiveChatRoomDto[], roomId, activeCall),
    } as unknown as LiveChatRoomDto[];
  }

  return rooms;
}
