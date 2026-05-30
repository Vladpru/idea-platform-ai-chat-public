import { SettingsPage } from '@/pages/settings';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/settings')({
  head: () => pageDocumentHead('Settings'),
  component: SettingsPage,
});
