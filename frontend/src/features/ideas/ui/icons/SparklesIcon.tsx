import starsSvg from '@/features/ideas/assets/stars.svg';

import { cn } from '@/shared/lib/utils';

type SparklesIconProps = {
  className?: string;
};

export function SparklesIcon({ className }: SparklesIconProps) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-3.5 shrink-0 bg-current', className)}
      style={{
        maskImage: `url("${starsSvg}")`,
        WebkitMaskImage: `url("${starsSvg}")`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  );
}
