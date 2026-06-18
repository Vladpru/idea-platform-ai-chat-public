import { Button, Section } from '@react-email/components';
import * as React from 'react';

import { emailClasses } from './email-tokens';

type EmailPrimaryButtonProps = {
  href: string;
  label: string;
  className?: string;
  withSpacing?: boolean;
};

export function EmailPrimaryButton({
  href,
  label,
  className,
  withSpacing = false,
}: EmailPrimaryButtonProps) {
  return (
    <Section
      className={
        withSpacing ? 'mt-[24px] mb-[24px] text-center' : 'text-center'
      }
    >
      <Button href={href} className={className ?? emailClasses.primaryButton}>
        {label}
      </Button>
    </Section>
  );
}
