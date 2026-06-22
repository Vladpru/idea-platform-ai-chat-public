import { StatisticsPage } from '@/pages/statistics';
import { createFileRoute } from '@tanstack/react-router';

import { pageDocumentHead } from '@/shared/lib/document-head';

export const Route = createFileRoute('/_auth/statistics')({
  head: () => pageDocumentHead('Statistics'),
  component: StatisticsPage,
});
