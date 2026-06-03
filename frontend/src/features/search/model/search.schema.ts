import { z } from 'zod';

export const SearchSchema = z.object({
  q: z
    .string()
    .trim()
    .min(3, 'Minimum of 3 characters required')
    .max(200, 'Maximum of 200 characters allowed'),
});
