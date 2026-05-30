import { HomePage } from '@/pages/home';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/')({
  head: () => pageDocumentHead('Home'),
  component: HomePage,
});
