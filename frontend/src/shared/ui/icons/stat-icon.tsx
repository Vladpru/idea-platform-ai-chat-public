import { cn } from '@/shared/lib/utils';

export type StatIconProps = {
  src: string;
  className?: string;
};

export function StatIcon({ src, className }: StatIconProps) {
  return (
    <img src={src} alt="" aria-hidden className={cn('shrink-0', className)} />
  );
}
