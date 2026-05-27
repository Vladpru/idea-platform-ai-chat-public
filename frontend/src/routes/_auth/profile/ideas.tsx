import { ProfileIdeasPage } from '@/pages/profile';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const IDEAS_DASHBOARD_TAB_VALUES = ['published', 'drafts', 'joined'] as const;

export const ideasDashboardSearchSchema = z.object({
  tab: z.enum(IDEAS_DASHBOARD_TAB_VALUES).catch('published'),
});

export type IdeasDashboardSearchParams = z.infer<typeof ideasDashboardSearchSchema>;

export const Route = createFileRoute('/_auth/profile/ideas')({
  validateSearch: search => ideasDashboardSearchSchema.parse(search),
  component: ProfileIdeasPage,
});
