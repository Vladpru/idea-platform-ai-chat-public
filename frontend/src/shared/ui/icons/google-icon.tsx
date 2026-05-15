import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/utils';

export type GoogleIconProps = ComponentPropsWithoutRef<'svg'>;

export function GoogleIcon({ className, ...props }: GoogleIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(className)}
      {...props}
    >
      <path
        fill="currentColor"
        d="M21.6 12.227c0-.71-.064-1.392-.182-2.045H12v3.87h5.389a4.61 4.61 0 0 1-2 3.02v2.51h3.237c1.894-1.745 2.974-4.314 2.974-7.355Z"
      />
      <path
        fill="currentColor"
        d="M12 22c2.7 0 4.965-.895 6.62-2.418l-3.237-2.51c-.895.602-2.04.96-3.383.96-2.605 0-4.814-1.76-5.603-4.126H3.05v2.59A9.997 9.997 0 0 0 12 22Z"
      />
      <path
        fill="currentColor"
        d="M6.397 13.906A5.994 5.994 0 0 1 6.08 12c0-.662.115-1.302.318-1.906V7.504H3.05A9.997 9.997 0 0 0 2 12c0 1.61.386 3.134 1.05 4.496l3.347-2.59Z"
      />
      <path
        fill="currentColor"
        d="M12 5.968c1.468 0 2.784.505 3.82 1.495l2.863-2.863C16.96 2.905 14.697 2 12 2 8.092 2 4.71 4.238 3.05 7.504l3.347 2.59c.79-2.366 3-4.126 5.603-4.126Z"
      />
    </svg>
  );
}
