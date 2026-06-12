export const LIVE_CHAT_ROUTES = {
  root: '/live-chats',
  byEntity: (entityType: string, entityId: string) =>
    `/live-chats/by-entity/${entityType}/${entityId}`,
  direct: (userId: string) => `/live-chats/direct/${userId}`,
  room: (roomId: string) => `/live-chats/${roomId}`,
  messages: (roomId: string) => `/live-chats/${roomId}/messages`,
  uploadAttachment: (roomId: string) =>
    `/live-chats/${roomId}/messages/upload`,
  calls: (roomId: string) => `/live-chats/${roomId}/calls`,
  call: (roomId: string, callId: string) =>
    `/live-chats/${roomId}/calls/${callId}`,
  joinCall: (roomId: string, callId: string) =>
    `/live-chats/${roomId}/calls/${callId}/join`,
} as const;
