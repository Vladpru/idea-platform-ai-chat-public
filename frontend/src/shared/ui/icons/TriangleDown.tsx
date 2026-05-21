import * as React from 'react';

import { cn } from '@/shared/lib/utils';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function TriangleDown({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-4 w-4 shrink-0', className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 18L4 6H20L12 18Z" />
    </svg>
  );
}
