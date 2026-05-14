import { IdeasPage } from '@/pages/ideas';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/ideas')({
  component: IdeasPage,
});
