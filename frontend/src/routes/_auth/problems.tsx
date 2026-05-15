import { ProblemsPage } from '@/pages/problems';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/problems')({
  component: ProblemsPage,
});
