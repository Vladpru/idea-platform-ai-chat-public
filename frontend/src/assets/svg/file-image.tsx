import type { ComponentPropsWithoutRef } from 'react';
import fileImageSvg from '@/assets/svg/file-image.svg';
import { cn } from '@/shared/lib/utils';

export type FileImageIconProps = ComponentPropsWithoutRef<'img'>;

export function FileImageIcon({ className, ...props }: FileImageIconProps) {
  return (
    <img
      src={fileImageSvg}
      alt=""
      aria-hidden
      className={cn('size-11 shrink-0', className)}
      {...props}
    />
  );
}
