import { Skeleton } from '@/shared/ui/skeleton';

const LINES = ['w-full', 'w-[92%]', 'w-[68%]'] as const;

export function AiSummarySkeleton() {
  return (
    <div className="space-y-2.5" aria-hidden>
      {LINES.map((width, index) => (
        <Skeleton key={index} className={`h-3.5 ${width}`} />
      ))}
    </div>
  );
}
