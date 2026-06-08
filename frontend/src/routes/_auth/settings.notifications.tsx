import { SettingsPanel } from '@/features/settings';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/settings/notifications')({
  head: () => pageDocumentHead('Notification settings'),
  component: SettingsPage,
});

function SettingsPage() {
  return <SettingsPanel />;
}
