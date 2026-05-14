import * as React from 'react';

import { cn } from '@/shared/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'border-brand-gray-200 bg-background ring-offset-background placeholder:text-brand-gray-400 focus-visible:ring-brand-gray-400 text-brand-extra-black flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
