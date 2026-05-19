import arrowLink from '@/features/ideas/assets/arrow-link.svg';

import { cn } from '@/shared/lib/utils';

type SparklesIconProps = {
  className?: string;
};

export function ArrowLink({ className }: SparklesIconProps) {
  return (
    <img
      src={arrowLink}
      alt=""
      aria-hidden
      className={cn('size-3.5 shrink-0', className)}
    />
  );
}
