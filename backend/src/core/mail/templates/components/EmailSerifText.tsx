import { Text } from '@react-email/components';
import * as React from 'react';

import { emailClasses } from './email-tokens';

type EmailSerifTextProps = {
  children: React.ReactNode;
};

export function EmailSerifText({ children }: EmailSerifTextProps) {
  return <Text className={emailClasses.serifText}>{children}</Text>;
}
