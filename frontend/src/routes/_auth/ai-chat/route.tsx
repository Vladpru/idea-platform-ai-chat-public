import { createFileRoute } from '@tanstack/react-router';

import { AiChatPage } from '@/features/ai-chat';

export const Route = createFileRoute('/_auth/ai-chat')({
  component: AiChatPage,
});
