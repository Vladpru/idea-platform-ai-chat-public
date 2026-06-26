import { createFileRoute } from '@tanstack/react-router';

import { AiChatSession } from '@/features/ai-chat';

function AiChatSessionRoute() {
  const { sessionId } = Route.useParams();
  const { q } = Route.useSearch();
  return <AiChatSession key={sessionId} initialMessage={q} />;
}

export const Route = createFileRoute('/_auth/ai-chat/$sessionId')({
  component: AiChatSessionRoute,
  validateSearch: (search): { q?: string } => ({
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
});
