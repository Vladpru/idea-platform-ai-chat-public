import { ProfileProblemsPage } from '@/pages/profile';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/profile/problems')({
  component: ProfileProblemsPage,
});
