import type { ComponentPropsWithoutRef } from 'react';
import likeSvg from '@/assets/svg/like.svg';
import { cn } from '@/shared/lib/utils';

export type LikeIconProps = ComponentPropsWithoutRef<'img'>;

export function LikeIcon({ className, ...props }: LikeIconProps) {
  return (
    <img
      src={likeSvg}
      alt=""
      aria-hidden
      className={cn('size-5 shrink-0', className)}
      {...props}
    />
  );
}
