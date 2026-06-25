import { createFileRoute } from '@tanstack/react-router';

import { AiChatSession } from '@/features/ai-chat';

export const Route = createFileRoute('/_auth/ai-chat/$sessionId')({
  component: AiChatSession,
});
