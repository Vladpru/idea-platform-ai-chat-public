import { IdeaCreationPage } from '@/pages/ideas';
import { pageDocumentHead } from '@/shared/lib/document-head';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const ideaCreationSearchSchema = z.object({
  ideaId: z.string().uuid().optional(),
});

export const Route = createFileRoute('/_auth/ideas/new')({
  validateSearch: search => ideaCreationSearchSchema.parse(search),
  head: () => pageDocumentHead('Idea Creation'),
  component: IdeaCreationPage,
});
