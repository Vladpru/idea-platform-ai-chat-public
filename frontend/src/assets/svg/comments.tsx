import type { ComponentPropsWithoutRef } from 'react';
import commentsSvg from '@/assets/svg/comments.svg';
import { cn } from '@/shared/lib/utils';

export type CommentsIconProps = ComponentPropsWithoutRef<'img'>;

export function CommentsIcon({ className, ...props }: CommentsIconProps) {
  return (
    <img
      src={commentsSvg}
      alt=""
      aria-hidden
      className={cn('size-5 shrink-0', className)}
      {...props}
    />
  );
}
