import type { ComponentPropsWithoutRef } from 'react';
import viewsSvg from '@/assets/svg/views.svg';
import { cn } from '@/shared/lib/utils';

export type ViewsIconProps = ComponentPropsWithoutRef<'img'>;

export function ViewsIcon({ className, ...props }: ViewsIconProps) {
  return (
    <img
      src={viewsSvg}
      alt=""
      aria-hidden
      className={cn('size-5 shrink-0', className)}
      {...props}
    />
  );
}
