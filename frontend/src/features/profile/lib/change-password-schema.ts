import { z } from 'zod';

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const requiredString = (message: string) =>
  z.string().min(1, { error: message });

const newPasswordField = z
  .string()
  .min(1, { error: 'New password is required' })
  .min(8, { error: 'Password must be at least 8 characters' })
  .max(64, { error: 'Password must be at most 64 characters' })
  .refine(value => value === value.trim(), {
    error: 'Password cannot start or end with spaces',
  })
  .refine(value => SPECIAL_CHAR_REGEX.test(value), {
    error: 'Must contain at least one special character',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: requiredString('Please enter your current password'),
    newPassword: newPasswordField,
    confirmPassword: requiredString('Please confirm your password'),
  })
  .refine(data => data.newPassword !== data.currentPassword, {
    error: 'New password must be different from your current password',
    path: ['newPassword'],
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const changePasswordDefaultValues: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
