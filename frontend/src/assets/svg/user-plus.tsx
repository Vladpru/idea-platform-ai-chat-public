import type { ComponentPropsWithoutRef } from 'react';
import userPlusSvg from '@/assets/svg/user-plus.svg';
import { cn } from '@/shared/lib/utils';

export type UserPlusIconProps = ComponentPropsWithoutRef<'img'>;

export function UserPlusIcon({ className, ...props }: UserPlusIconProps) {
  return (
    <img
      src={userPlusSvg}
      alt=""
      aria-hidden
      className={cn('size-6 shrink-0', className)}
      {...props}
    />
  );
}
