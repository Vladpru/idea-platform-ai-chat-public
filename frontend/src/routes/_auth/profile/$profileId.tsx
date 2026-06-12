import { UserProfilePage } from '@/pages/profile/ui/UserProfilePage';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const profileParamsSchema = z.object({
  profileId: z.string().uuid(),
});

const profileContributionsSearchSchema = z.object({
  tab: z.enum(['all', 'ideas', 'problems', 'joined', 'drafts']).catch('all'),
});

export const Route = createFileRoute('/_auth/profile/$profileId')({
  parseParams: raw => profileParamsSchema.parse(raw),
  validateSearch: search => profileContributionsSearchSchema.parse(search),
  head: () => pageDocumentHead('Profile'),
  component: UserProfilePage,
});
