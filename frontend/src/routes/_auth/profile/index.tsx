import { ProfilePage } from '@/pages/profile';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/profile/')({
  component: ProfilePage,
});
