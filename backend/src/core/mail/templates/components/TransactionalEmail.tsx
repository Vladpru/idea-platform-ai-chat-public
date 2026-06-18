import { Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';

import { EmailLayout } from './EmailLayout';
import { EmailSplitHeadline } from './EmailSplitHeadline';
import { emailClasses } from './email-tokens';

type TransactionalEmailProps = {
  preview: string;
  headline?: string;
  splitHeadline?: { prefix: string; accent: string };
  subheading?: string;
  children: React.ReactNode;
  disclaimer?: string;
};

export function TransactionalEmail({
  preview,
  headline,
  splitHeadline,
  subheading,
  children,
  disclaimer,
}: TransactionalEmailProps) {
  return (
    <EmailLayout preview={preview}>
      <Section className={emailClasses.contentSection}>
        {splitHeadline ? (
          <EmailSplitHeadline
            prefix={splitHeadline.prefix}
            accent={splitHeadline.accent}
          />
        ) : headline ? (
          <Heading className={emailClasses.headline}>{headline}</Heading>
        ) : null}

        <Hr className={emailClasses.divider} />

        {subheading ? (
          <Heading as="h3" className={emailClasses.subheading}>
            {subheading}
          </Heading>
        ) : null}

        {children}

        {disclaimer ? (
          <Text className={emailClasses.disclaimer}>{disclaimer}</Text>
        ) : null}
      </Section>
    </EmailLayout>
  );
}
