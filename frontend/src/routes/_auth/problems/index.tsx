import { ProblemsPage } from '@/pages/problems';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const SORT_VALUES = [
  'newest',
  'oldest',
  'most-viewed',
  'most-popular',
  'most-ideas-linked',
] as const;

const STAGE_VALUES = ['active', 'completed', 'archived'] as const;

export const problemsSearchSchema = z.object({
  sort: z.enum(SORT_VALUES).catch('newest'),
  stage: z.enum(STAGE_VALUES).optional().catch(undefined),
});

export type ProblemsSearchParams = z.infer<typeof problemsSearchSchema>;

export const Route = createFileRoute('/_auth/problems/')({
  validateSearch: search => problemsSearchSchema.parse(search),
  component: ProblemsPage,
});
