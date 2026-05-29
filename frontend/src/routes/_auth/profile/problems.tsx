import { ProfileProblemsPage } from '@/pages/profile';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const PROBLEMS_DASHBOARD_TAB_VALUES = [
  'published',
  'drafts',
  'joined',
] as const;

export const problemsDashboardSearchSchema = z.object({
  tab: z.enum(PROBLEMS_DASHBOARD_TAB_VALUES).catch('published'),
});

export type ProblemsDashboardSearchParams = z.infer<
  typeof problemsDashboardSearchSchema
>;

export const Route = createFileRoute('/_auth/profile/problems')({
  validateSearch: search => problemsDashboardSearchSchema.parse(search),
  head: () => pageDocumentHead('My Problems'),
  component: ProfileProblemsPage,
});
