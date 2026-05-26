export const PASSWORD_MAX_LENGTH = 64;

export const passwordMaxLengthMessage = `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;

export const passwordMaxLengthRule = {
  value: PASSWORD_MAX_LENGTH,
  message: passwordMaxLengthMessage,
} as const;
