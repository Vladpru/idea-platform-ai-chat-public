export const LIVE_CHAT_ROUTES = {
  root: '/live-chats',
  byEntity: (entityType: string, entityId: string) =>
    `/live-chats/by-entity/${entityType}/${entityId}`,
  room: (roomId: string) => `/live-chats/${roomId}`,
  messages: (roomId: string) => `/live-chats/${roomId}/messages`,
} as const;
