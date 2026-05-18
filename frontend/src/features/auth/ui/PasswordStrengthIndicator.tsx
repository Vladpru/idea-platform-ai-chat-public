import zxcvbn from 'zxcvbn';
import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';
import { Progress } from '@/shared/ui/progress';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

const STRENGTH_DATA = [
  {
    label: 'Very Weak',
    color: '[&>div]:bg-destructive',
    textColor: 'text-destructive',
  },
  {
    label: 'Weak',
    color: '[&>div]:bg-destructive',
    textColor: 'text-destructive',
  },
  {
    label: 'Medium',
    color: '[&>div]:bg-yellow-500',
    textColor: 'text-yellow-500',
  },
  {
    label: 'Strong',
    color: '[&>div]:bg-green-500',
    textColor: 'text-green-500',
  },
  {
    label: 'Very Strong',
    color: '[&>div]:bg-green-500',
    textColor: 'text-green-500',
  },
] as const;

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const score = useMemo(
    () => (password ? zxcvbn(password).score : null),
    [password],
  );

  if (score === null) return null;

  const { label, color, textColor } = STRENGTH_DATA[score];

  return (
    <div className="mt-2 flex w-full flex-col gap-1">
      <Progress
        value={(score / 4) * 100}
        className={cn('bg-muted h-1.5 w-full', color)}
      />
      <span
        className={cn('text-right text-xs font-semibold uppercase', textColor)}
      >
        {label}
      </span>
    </div>
  );
}
