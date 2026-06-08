import { cn } from '@/shared/lib/utils';

type NotificationActorBadgeProps = {
  name: string;
  className?: string;
};

export function NotificationActorBadge({
  name,
  className,
}: NotificationActorBadgeProps) {
  return (
    <span
      className={cn(
        'bg-muted text-foreground inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        className,
      )}
    >
      {name}
    </span>
  );
}
