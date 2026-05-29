import { ProfilePage } from '@/pages/profile';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/profile/')({
  head: () => pageDocumentHead('My Account'),
  component: ProfilePage,
});
