import { BadRequestException } from '@nestjs/common';

export function validateNewPassword(
  password: unknown,
  fieldLabel = 'Password',
): string {
  if (typeof password !== 'string' || !password) {
    throw new BadRequestException(`${fieldLabel} is required`);
  }

  if (password.length > 150) {
    throw new BadRequestException(`${fieldLabel} is too long`);
  }

  if (password.length < 8) {
    throw new BadRequestException(
      `${fieldLabel} must be at least 8 characters`,
    );
  }

  return password;
}

export function validateEmail(email: unknown): string {
  if (typeof email !== 'string' || !email.trim()) {
    throw new BadRequestException('Email is required');
  }

  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalized)) {
    throw new BadRequestException('Email must be valid');
  }

  return normalized;
}
