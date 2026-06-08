import { Button, Section } from '@react-email/components';
import * as React from 'react';

import { emailClasses } from './email-tokens';

type EmailCtaGroupProps = {
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
};

export function EmailCtaGroup({ primary, secondary }: EmailCtaGroupProps) {
  if (!primary && !secondary) {
    return null;
  }

  return (
    <Section className="mt-[24px] text-center">
      {primary ? (
        <Button href={primary.href} className={emailClasses.primaryButton}>
          {primary.label}
        </Button>
      ) : null}
      {secondary ? (
        <Button
          href={secondary.href}
          className={`${emailClasses.secondaryButton} mt-3 block`}
        >
          {secondary.label}
        </Button>
      ) : null}
    </Section>
  );
}
