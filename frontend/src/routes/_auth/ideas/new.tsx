import { IdeaCreationPage } from '@/pages/ideas';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/ideas/new')({
  component: IdeaCreationPage,
});
