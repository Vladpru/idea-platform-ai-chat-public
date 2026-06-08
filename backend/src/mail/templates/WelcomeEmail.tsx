import { Text } from '@react-email/components';
import * as React from 'react';

import { TransactionalEmail } from './components/TransactionalEmail';
import { emailClasses } from './components/email-tokens';

export const WelcomeEmail = () => {
  const previewText = `Welcome to The Idea Platform`;

  return (
    <TransactionalEmail
      preview={previewText}
      headline="WELCOME TO THE IDEA PLATFORM"
      subheading="We're glad you're here"
    >
      <Text className={emailClasses.bodyText}>
        Your account has been successfully created. We are excited to have you
        join our community of innovators and creators. Our platform is designed
        to help you capture, share, and develop the next big ideas.
      </Text>

      <Text className={`mt-[24px] ${emailClasses.bodyText}`}>
        You can now start exploring existing projects, submitting your own
        concepts, and collaborating with your team members to bring innovations
        to life.
      </Text>

      <Text className={emailClasses.disclaimer}>
        If you did not create an account, you can safely ignore this email.
      </Text>
    </TransactionalEmail>
  );
};
