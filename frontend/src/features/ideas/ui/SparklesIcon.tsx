import starsSvg from '@/features/ideas/assets/stars.svg';

import { cn } from '@/shared/lib/utils';

type SparklesIconProps = {
  className?: string;
};

export function SparklesIcon({ className }: SparklesIconProps) {
  return (
    <img
      src={starsSvg}
      alt=""
      aria-hidden
      className={cn('size-3.5 shrink-0', className)}
    />
  );
}
