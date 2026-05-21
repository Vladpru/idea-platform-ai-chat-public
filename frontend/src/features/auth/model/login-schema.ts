import {
  PASSWORD_MAX_LENGTH,
  passwordMaxLengthMessage,
} from '@/shared/lib/password-rules';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: 'Email is required' })
    .transform(value => value.toLowerCase())
    .pipe(z.email({ error: 'Invalid email format' })),
  password: z
    .string()
    .trim()
    .min(1, { error: 'Password is required' })
    .max(PASSWORD_MAX_LENGTH, { error: passwordMaxLengthMessage }),
});

export type LoginValues = z.infer<typeof loginSchema>;
