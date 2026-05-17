export function buildPasswordResetEmail(params: {
  resetUrl: string;
  expiresMinutes: number;
}) {
  const { resetUrl, expiresMinutes } = params;
  const subject = 'Reset your password';

  const text = [
    'You requested a password reset.',
    '',
    `Reset your password (link expires in ${expiresMinutes} minutes):`,
    resetUrl,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const html = `
    <p>You requested a password reset.</p>
    <p>
      <a href="${resetUrl}">Reset your password</a>
    </p>
    <p>This link expires in ${expiresMinutes} minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim();

  return { subject, text, html };
}
