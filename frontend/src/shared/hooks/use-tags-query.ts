import { fetchTags } from '@/shared/api/tags/tags.api';
import { useQuery } from '@tanstack/react-query';

export const tagQueryKeys = {
  all: ['tags'] as const,
  list: () => [...tagQueryKeys.all, 'list'] as const,
};

export function useTagsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tagQueryKeys.list(),
    queryFn: fetchTags,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}
