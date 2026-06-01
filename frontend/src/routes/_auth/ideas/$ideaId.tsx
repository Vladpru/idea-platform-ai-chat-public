import { discussionSearchSchema } from '@/features/discussion/lib/discussion-search';
import { IdeaDetailsPage } from '@/pages/ideas';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { z } from 'zod';

const ideaDetailsParamsSchema = z.object({
  ideaId: z.string().min(1),
});

export const Route = createFileRoute('/_auth/ideas/$ideaId')({
  parseParams: raw => ideaDetailsParamsSchema.parse(raw),
  validateSearch: search => discussionSearchSchema.parse(search),
  head: () => pageDocumentHead('Idea Details'),
  component: IdeaDetailsRoute,
});

function IdeaDetailsRoute() {
  const { ideaId } = useParams({ from: '/_auth/ideas/$ideaId' });
  return <IdeaDetailsPage ideaId={ideaId} />;
}
