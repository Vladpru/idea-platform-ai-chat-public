import { z } from 'zod';

export const discussionSearchSchema = z.object({
  sort: z.enum(['newest', 'oldest']).optional(),
  tab: z.enum(['discussion']).optional(),
  replyTo: z.string().min(1).optional(),
});

export type DiscussionSearch = z.infer<typeof discussionSearchSchema>;
