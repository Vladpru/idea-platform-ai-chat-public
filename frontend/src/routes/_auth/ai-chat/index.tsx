import { createFileRoute, redirect } from '@tanstack/react-router';

import { AiChatEmptyState } from '@/features/ai-chat';
import { useCreateSessionMutation } from '@/features/ai-chat/hooks/mutations/use-create-session-mutation';
import { useSessionsQuery } from '@/features/ai-chat/hooks/queries/use-sessions-query';

function AiChatIndexPage() {
  const { data: sessions = [], isLoading } = useSessionsQuery();
  const { mutate: createSession, isPending } = useCreateSessionMutation();

  if (isLoading) return null;

  if (sessions.length > 0) {
    throw redirect({
      to: '/ai-chat/$sessionId',
      params: { sessionId: sessions[0].id },
    });
  }

  return (
    <AiChatEmptyState
      onNewChat={() => createSession()}
      isLoading={isPending}
    />
  );
}

export const Route = createFileRoute('/_auth/ai-chat/')({
  component: AiChatIndexPage,
});
