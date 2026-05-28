import { SubmitProblemPage } from '@/pages/problems';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const problemCreationSearchSchema = z.object({
  problemId: z.string().uuid().optional(),
});

export const Route = createFileRoute('/_auth/problems/new')({
  validateSearch: search => problemCreationSearchSchema.parse(search),
  component: SubmitProblemPage,
});
