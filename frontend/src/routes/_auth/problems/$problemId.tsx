import { ProblemDetailsPage } from '@/pages/problems/ui/ProblemDetailsPage';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { z } from 'zod';

const problemDetailsParamsSchema = z.object({
  problemId: z.string().min(1),
});

export const Route = createFileRoute('/_auth/problems/$problemId')({
  params: {
    parse: params => problemDetailsParamsSchema.parse(params),
  },
  component: ProblemDetailsRoute,
});

function ProblemDetailsRoute() {
  const { problemId } = useParams({ from: '/_auth/problems/$problemId' });
  return <ProblemDetailsPage problemId={problemId} />;
}
