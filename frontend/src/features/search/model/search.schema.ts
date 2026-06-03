import { z } from 'zod';

export const SearchSchema = z.object({
  q: z.string().max(200, 'Maximum of 200 characters allowed'),
});
