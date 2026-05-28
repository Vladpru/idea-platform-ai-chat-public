import starIcon from '@/assets/svg/star.svg';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/utils';

export type StarsIconProps = Omit<
  ComponentPropsWithoutRef<'img'>,
  'src' | 'alt'
>;

export function StarsIcon({ className, ...props }: StarsIconProps) {
  return (
    <img
      src={starIcon}
      alt=""
      aria-hidden
      className={cn('size-5 shrink-0', className)}
      {...props}
    />
  );
}
