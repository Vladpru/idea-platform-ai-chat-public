export const AI_CHAT_ROUTES = {
  sessions: '/ai/chat/sessions',
  session: (id: string) => `/ai/chat/sessions/${id}`,
  messages: (id: string) => `/ai/chat/sessions/${id}/messages`,
  stream: (id: string) => `/ai/chat/sessions/${id}/stream`,
  kbStats: '/ai/chat/kb-stats',
} as const;
