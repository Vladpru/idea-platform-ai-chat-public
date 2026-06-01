import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

type ActivityMetric = {
  label: string;
  value: number;
  to: string;
  search?: Record<string, string>;
};

type HomeActivityCardProps = {
  title: string;
  icon: LucideIcon;
  metrics: ActivityMetric[];
  isLoading?: boolean;
};

function ActivityMetricSkeleton() {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-8" />
    </div>
  );
}

export function HomeActivityCard({
  title,
  icon: Icon,
  metrics,
  isLoading = false,
}: HomeActivityCardProps) {
  return (
    <section className="border-brand-gray-200 h-full rounded-lg border bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="bg-brand-light-blue text-brand-dark-blue flex size-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="text-brand-dark-blue text-lg font-bold">{title}</h2>
      </div>

      <dl className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <ActivityMetricSkeleton key={index} />
            ))
          : metrics.map(metric => (
              <div
                key={metric.label}
                className="flex items-baseline justify-between gap-4"
              >
                <dt className="text-brand-gray-700 text-sm">{metric.label}</dt>
                <dd>
                  <Link
                    to={metric.to}
                    search={metric.search}
                    className={cn(
                      'text-brand-dark-blue text-lg font-bold tabular-nums underline-offset-2 hover:underline',
                      metric.value === 0 && 'text-brand-gray-700',
                    )}
                  >
                    {metric.value}
                  </Link>
                </dd>
              </div>
            ))}
      </dl>
    </section>
  );
}
