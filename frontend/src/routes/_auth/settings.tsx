import { SettingsPage } from '@/pages/settings';
import { settingsSearchSchema } from '@/features/settings/lib/settings-tab';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/settings')({
  validateSearch: search => settingsSearchSchema.parse(search),
  head: () => pageDocumentHead('Settings'),
  component: SettingsPage,
});
