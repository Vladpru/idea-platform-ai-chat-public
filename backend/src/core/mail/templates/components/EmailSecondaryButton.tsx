import { Button, Section } from '@react-email/components';
import * as React from 'react';

import { emailClasses } from './email-tokens';

type EmailSecondaryButtonProps = {
  href: string;
  label: string;
};

export function EmailSecondaryButton({
  href,
  label,
}: EmailSecondaryButtonProps) {
  return (
    <Section className="mt-[12px] text-center">
      <Button href={href} className={emailClasses.secondaryButton}>
        {label}
      </Button>
    </Section>
  );
}
