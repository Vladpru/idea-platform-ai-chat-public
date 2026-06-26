import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { AiChatEmptyState } from '@/features/ai-chat';
import { useCreateSessionMutation } from '@/features/ai-chat/hooks/mutations/use-create-session-mutation';
import { useSessionsQuery } from '@/features/ai-chat/hooks/queries/use-sessions-query';

function AiChatIndexPage() {
  const { data: sessions = [], isLoading } = useSessionsQuery();
  const { mutate: createSession, isPending } = useCreateSessionMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && sessions.length > 0) {
      navigate({
        to: '/ai-chat/$sessionId',
        params: { sessionId: sessions[0].id },
        replace: true,
      });
    }
  }, [isLoading, sessions, navigate]);

  if (isLoading || sessions.length > 0) return null;

  return (
    <AiChatEmptyState
      onSuggestion={text => createSession({ initialMessage: text })}
      showNewChat
      isLoading={isPending}
    />
  );
}

export const Route = createFileRoute('/_auth/ai-chat/')({
  component: AiChatIndexPage,
});
