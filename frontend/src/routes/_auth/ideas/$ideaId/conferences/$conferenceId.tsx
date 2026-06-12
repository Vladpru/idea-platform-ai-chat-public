import { IdeaConferenceViewerPage } from '@/features/idea-conference/ui/IdeaConferenceViewerPage';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { z } from 'zod';

import { pageDocumentHead } from '@/shared/lib/document-head';

const ideaConferenceParamsSchema = z.object({
  ideaId: z.string().uuid(),
  conferenceId: z.string().uuid(),
});

export const Route = createFileRoute(
  '/_auth/ideas/$ideaId/conferences/$conferenceId',
)({
  params: {
    parse: params => ideaConferenceParamsSchema.parse(params),
  },
  head: () => pageDocumentHead('Idea Conference'),
  component: IdeaConferenceRoute,
});

function IdeaConferenceRoute() {
  const { ideaId, conferenceId } = useParams({
    from: '/_auth/ideas/$ideaId/conferences/$conferenceId',
  });

  return (
    <IdeaConferenceViewerPage
      ideaId={ideaId}
      conferenceId={conferenceId}
    />
  );
}
