import { z } from 'zod';

export const profileEditSchema = z.object({
  firstName: z.string().max(50),
  lastName: z.string().max(50),
});

export type ProfileEditValues = z.infer<typeof profileEditSchema>;

export const AVATAR_MAX_BYTES = 800 * 1024;
