import { Text, render } from '@react-email/components';
import * as React from 'react';

import { EmailCtaGroup } from './components/EmailCtaGroup';
import { TransactionalEmail } from './components/TransactionalEmail';
import { emailClasses } from './components/email-tokens';

interface PasswordResetEmailProps {
  resetUrl: string;
  expiresMinutes: number;
}

const PasswordResetEmailTemplate = ({
  resetUrl,
  expiresMinutes,
}: PasswordResetEmailProps) => {
  const previewText = `Reset your password - The Idea Platform`;

  return (
    <TransactionalEmail
      preview={previewText}
      headline="RESET YOUR PASSWORD"
      subheading="Password Reset Request"
      disclaimer="If you did not request this, you can safely ignore this email. Your password will remain unchanged."
    >
      <Text className={emailClasses.bodyText}>
        You requested a password reset for your account on The Idea Platform.
        Click the button below to set up a new password.
      </Text>

      <EmailCtaGroup primary={{ href: resetUrl, label: 'Reset Password' }} />

      <Text className={emailClasses.bodyText}>
        This link will expire in <strong>{expiresMinutes} minutes</strong>.
      </Text>
    </TransactionalEmail>
  );
};

export async function buildPasswordResetEmail(params: {
  resetUrl: string;
  expiresMinutes: number;
}) {
  const { resetUrl, expiresMinutes } = params;
  const subject = 'Reset your password';

  const html = await render(
    <PasswordResetEmailTemplate
      resetUrl={resetUrl}
      expiresMinutes={expiresMinutes}
    />,
  );

  const text = await render(
    <PasswordResetEmailTemplate
      resetUrl={resetUrl}
      expiresMinutes={expiresMinutes}
    />,
    { plainText: true },
  );

  return { subject, text, html };
}
