import { ideaDetailsSearchSchema } from '@/features/idea-details/lib/idea-details-search';
import { IdeaDetailsPage } from '@/pages/ideas';
import { createFileRoute, useParams } from '@tanstack/react-router';

import { pageDocumentHead } from '@/shared/lib/document-head';

export const Route = createFileRoute('/_auth/ideas/$ideaId/')({
  validateSearch: search => ideaDetailsSearchSchema.parse(search),
  head: () => pageDocumentHead('Idea Details'),
  component: IdeaDetailsRoute,
});

function IdeaDetailsRoute() {
  const { ideaId } = useParams({ from: '/_auth/ideas/$ideaId' });
  return <IdeaDetailsPage ideaId={ideaId} />;
}
