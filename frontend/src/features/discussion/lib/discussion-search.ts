import { z } from 'zod';

export const discussionSearchSchema = z.object({
  sort: z.enum(['newest', 'oldest']).optional(),
});

export type DiscussionSearch = z.infer<typeof discussionSearchSchema>;
