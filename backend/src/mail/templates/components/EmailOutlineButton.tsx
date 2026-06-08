import { Button, Section } from '@react-email/components';
import * as React from 'react';

import { emailClasses } from './email-tokens';

type EmailOutlineButtonProps = {
  href: string;
  label: string;
};

export function EmailOutlineButton({ href, label }: EmailOutlineButtonProps) {
  return (
    <Section className="mt-[24px] text-center">
      <Button href={href} className={emailClasses.outlineButton}>
        {label}
      </Button>
    </Section>
  );
}
