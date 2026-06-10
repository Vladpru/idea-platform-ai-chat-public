import type { LiveChatEntityType } from '@/features/live-chat/api/live-chat-api.types';
import { fetchIdeas } from '@/features/ideas/api/ideas.api';
import { fetchProblems } from '@/features/problems/api/problems.api';
import { useQuery } from '@tanstack/react-query';

export type LiveChatEntityOption = {
  id: string;
  title: string;
  entityType: LiveChatEntityType;
};

async function fetchLiveChatEntityOptions(
  entityType: LiveChatEntityType,
): Promise<LiveChatEntityOption[]> {
  if (entityType === 'ideas') {
    const response = await fetchIdeas({ limit: 50, page: 1 });
    return response.data.map(idea => ({
      id: idea.id,
      title: idea.title?.trim() || 'Untitled idea',
      entityType: 'ideas',
    }));
  }

  const response = await fetchProblems({ limit: 50, page: 1 });
  return response.data.map(problem => ({
    id: problem.id,
    title: problem.title?.trim() || 'Untitled problem',
    entityType: 'problems',
  }));
}

export function useLiveChatEntityOptionsQuery(
  entityType: LiveChatEntityType,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['live-chat', 'entity-options', entityType],
    queryFn: () => fetchLiveChatEntityOptions(entityType),
    enabled,
  });
}
