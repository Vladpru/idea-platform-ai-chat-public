import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.email({ error: 'Invalid email format' }),
    password: z
      .string()
      .min(8, { error: 'Password must be at least 8 characters long' })

      .regex(/[A-Z]/, { error: 'Must contain at least one uppercase letter' })
      .regex(/[0-9]/, { error: 'Must contain at least one number' }),
    confirmPassword: z
      .string()
      .min(1, { error: 'Please confirm your password' }),
  })
  .refine(data => data.password === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
