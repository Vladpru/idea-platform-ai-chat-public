import { discussionSearchSchema } from '@/features/discussion/lib/discussion-search';
import { z } from 'zod';

const booleanSearchParamSchema = z
  .union([z.literal('true'), z.literal('1'), z.boolean()])
  .optional()
  .transform(value =>
    value === undefined
      ? undefined
      : value === true || value === 'true' || value === '1',
  );

export const ideaDetailsSearchSchema = discussionSearchSchema
  .extend({
    edit: booleanSearchParamSchema,
    updated: booleanSearchParamSchema,
  })
  .partial({ edit: true, updated: true });

export type IdeaDetailsSearch = z.infer<typeof ideaDetailsSearchSchema>;
