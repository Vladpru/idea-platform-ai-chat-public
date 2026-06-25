export const aiChatQueryKeys = {
  sessions: () => ['ai-chat', 'sessions'] as const,
  messages: (sessionId: string) => ['ai-chat', 'messages', sessionId] as const,
};
