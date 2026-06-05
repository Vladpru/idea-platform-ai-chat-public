import { discussionSearchSchema } from '@/features/discussion/lib/discussion-search';
import { z } from 'zod';

const booleanSearchParamSchema = z
  .union([z.literal('true'), z.literal('1'), z.boolean()])
  .optional()
  .transform(value => value === true || value === 'true' || value === '1');

export const problemDetailsSearchSchema = discussionSearchSchema.extend({
  updated: booleanSearchParamSchema,
});

export type ProblemDetailsSearch = z.infer<typeof problemDetailsSearchSchema>;
