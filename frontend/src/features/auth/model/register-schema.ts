import {
  PASSWORD_MAX_LENGTH,
  passwordMaxLengthMessage,
} from '@/shared/lib/password-rules';
import { z } from 'zod';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export const registerSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email' }).trim().toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(PASSWORD_MAX_LENGTH, passwordMaxLengthMessage)
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .refine(value => !/\s/.test(value), 'Password must not contain spaces')
      .refine(
        value => SPECIAL_CHAR_REGEX.test(value),
        'Must contain at least one special character',
      ),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password')
      .max(PASSWORD_MAX_LENGTH, passwordMaxLengthMessage),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
