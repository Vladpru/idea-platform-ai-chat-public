import { ProblemsPage } from '@/pages/problems';
import { PROBLEMS_DASHBOARD_LABELS } from '@/features/problems-dashboard/lib/problems-dashboard-labels';
import { pageDocumentHead } from '@/shared/lib/document-head';
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
  feedOnly: z.boolean().optional().catch(undefined),
});

export type ProblemsSearchParams = z.infer<typeof problemsSearchSchema>;

export const Route = createFileRoute('/_auth/problems/')({
  validateSearch: search => problemsSearchSchema.parse(search),
  head: () => pageDocumentHead(PROBLEMS_DASHBOARD_LABELS.pageTitle),
  component: ProblemsPage,
});
