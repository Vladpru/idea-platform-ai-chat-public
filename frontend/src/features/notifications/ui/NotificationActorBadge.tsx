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
        'bg-muted text-foreground inline-flex max-w-[10rem] items-center overflow-hidden rounded-full px-2 py-0.5 text-xs font-semibold',
        className,
      )}
    >
      <span className="truncate">{name}</span>
    </span>
  );
}
