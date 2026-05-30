import { StatisticsPage } from '@/pages/statistics';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/statistics')({
  head: () => pageDocumentHead('Statistics'),
  component: StatisticsPage,
});
