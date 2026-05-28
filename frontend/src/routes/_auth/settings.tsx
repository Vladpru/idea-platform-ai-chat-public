import { SettingsPage } from '@/pages/settings';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/settings')({
  component: SettingsPage,
});
