import { z } from 'zod';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { error: 'Password must be at least 8 characters' })
      .max(150, { error: 'Password must be at most 150 characters' })
      .regex(/[A-Z]/, { error: 'Must contain at least one uppercase letter' })
      .regex(/[a-z]/, { error: 'Must contain at least one lowercase letter' })
      .regex(/[0-9]/, { error: 'Must contain at least one number' })
      .refine(value => SPECIAL_CHAR_REGEX.test(value), {
        error: 'Must contain at least one special character',
      })
      .refine(value => !/\s/.test(value), {
        error: 'Password must not contain spaces',
      })
      .refine(value => SPECIAL_CHAR_REGEX.test(value), {
        error: 'Must contain at least one special character',
      }),
    confirmPassword: z
      .string()
      .min(1, { error: 'Please confirm your password' }),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
