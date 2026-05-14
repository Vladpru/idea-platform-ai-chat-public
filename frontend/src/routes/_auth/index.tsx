import { HomePage } from '@/pages/home/components/HomePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/')({
  component: HomePage,
});
