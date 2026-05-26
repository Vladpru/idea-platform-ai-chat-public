import { IdeasPage } from '@/pages/ideas';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const SORT_VALUES = ['newest', 'oldest', 'views', 'likes', 'comments'] as const;
const STAGE_VALUES = [
  'ideation',
  'prototyping',
  'completed',
  'paused',
  'archived',
] as const;

export const ideasSearchSchema = z.object({
  sort: z.enum(SORT_VALUES).catch('newest'),
  stage: z.enum(STAGE_VALUES).optional().catch(undefined),
});

export type IdeasSearchParams = z.infer<typeof ideasSearchSchema>;

export const Route = createFileRoute('/_auth/ideas/')({
  validateSearch: search => ideasSearchSchema.parse(search),
  component: IdeasPage,
});
