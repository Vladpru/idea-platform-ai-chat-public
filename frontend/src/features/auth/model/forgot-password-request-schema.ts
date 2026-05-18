import { z } from 'zod';

export const forgotPasswordRequestSchema = z.object({
  email: z.email({ error: 'Invalid email format' }),
});

export type ForgotPasswordRequestValues = z.infer<
  typeof forgotPasswordRequestSchema
>;
