import { GlobalSearchPage } from '@/features/search';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/search')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (typeof search.q === 'string' ? search.q : ''),
    t: search.t === 'problems' ? ('problems' as const) : ('ideas' as const),
  }),
  component: GlobalSearchPage,
});
