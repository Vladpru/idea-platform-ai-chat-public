import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: 'Please enter your current password' }),
    newPassword: z
      .string()
      .min(8, { error: 'Password must be at least 8 characters long' })
      .regex(/[A-Z]/, { error: 'Must contain at least one uppercase letter' })
      .regex(/[0-9]/, { error: 'Must contain at least one number' }),
    confirmPassword: z
      .string()
      .min(1, { error: 'Please confirm your password' }),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
