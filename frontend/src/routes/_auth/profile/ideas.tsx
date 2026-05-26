import { ProfileIdeasPage } from '@/pages/profile';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/profile/ideas')({
  component: ProfileIdeasPage,
});
