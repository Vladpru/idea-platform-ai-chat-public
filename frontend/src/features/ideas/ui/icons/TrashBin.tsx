import trashBin from '@/features/ideas/assets/delete-bin.svg';

import { cn } from '@/shared/lib/utils';

type SparklesIconProps = {
  className?: string;
};

export function TrashBin({ className }: SparklesIconProps) {
  return (
    <img
      src={trashBin}
      alt=""
      aria-hidden
      className={cn('size-3.5 shrink-0', className)}
    />
  );
}
