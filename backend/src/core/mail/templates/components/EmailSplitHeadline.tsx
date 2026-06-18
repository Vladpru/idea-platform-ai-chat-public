import { Heading } from '@react-email/components';
import * as React from 'react';

import { emailClasses } from './email-tokens';

type EmailSplitHeadlineProps = {
  prefix: string;
  accent: string;
};

export function EmailSplitHeadline({ prefix, accent }: EmailSplitHeadlineProps) {
  return (
    <Heading className={emailClasses.splitHeadline} as="h2">
      {prefix}{' '}
      <span className={emailClasses.splitHeadlineAccent}>{accent}</span>
    </Heading>
  );
}
