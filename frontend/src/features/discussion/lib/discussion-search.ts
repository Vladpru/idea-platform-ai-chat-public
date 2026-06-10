import { z } from 'zod';

export const discussionSearchSchema = z.object({
  sort: z.enum(['newest', 'oldest']).optional(),
  tab: z
    .union([z.literal('discussion'), z.literal('live-chat')])
    .optional()
    .transform(value => (value === 'live-chat' ? undefined : value)),
  replyTo: z.string().min(1).optional(),
});

export type DiscussionSearch = z.infer<typeof discussionSearchSchema>;
