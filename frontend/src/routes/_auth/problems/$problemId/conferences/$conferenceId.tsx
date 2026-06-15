import { ConferenceViewerPage } from '@/features/conference/ui/ConferenceViewerPage';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { z } from 'zod';

import { pageDocumentHead } from '@/shared/lib/document-head';

const problemConferenceParamsSchema = z.object({
  problemId: z.string().uuid(),
  conferenceId: z.string().uuid(),
});

export const Route = createFileRoute(
  '/_auth/problems/$problemId/conferences/$conferenceId',
)({
  params: {
    parse: params => problemConferenceParamsSchema.parse(params),
  },
  head: () => pageDocumentHead('Problem Conference'),
  component: ProblemConferenceRoute,
});

function ProblemConferenceRoute() {
  const { problemId, conferenceId } = useParams({
    from: '/_auth/problems/$problemId/conferences/$conferenceId',
  });

  return (
    <ConferenceViewerPage
      entityType="PROBLEM"
      entityId={problemId}
      conferenceId={conferenceId}
    />
  );
}
