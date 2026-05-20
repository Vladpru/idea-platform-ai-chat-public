import { IdeaDetailsPage } from '@/pages/ideas';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { z } from 'zod';

const ideaDetailsParamsSchema = z.object({
  ideaId: z.string().min(1),
});

export const Route = createFileRoute('/_auth/ideas/$ideaId')({
  parseParams: raw => ideaDetailsParamsSchema.parse(raw),
  component: IdeaDetailsRoute,
});

function IdeaDetailsRoute() {
  const { ideaId } = useParams({ from: '/_auth/ideas/$ideaId' });
  return <IdeaDetailsPage ideaId={ideaId} />;
}
