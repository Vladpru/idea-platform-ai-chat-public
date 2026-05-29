import type { LucideIcon } from 'lucide-react';

import type { StatMetric } from '../model/statistics.types';
import {
  statisticsCardClass,
  statisticsIconTileClass,
  statisticsMetricValueClass,
} from './statistics-classes';

type StatMetricCardProps = {
  title: string;
  icon: LucideIcon;
  metrics: StatMetric[];
};

export function StatMetricCard({
  title,
  icon: Icon,
  metrics,
}: StatMetricCardProps) {
  return (
    <section className={`${statisticsCardClass} h-full w-full`}>
      <div className="mb-5 flex items-center gap-3">
        <span className={statisticsIconTileClass}>
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="text-brand-dark-blue text-lg font-bold">{title}</h2>
      </div>
      <dl className="flex flex-col gap-3">
        {metrics.map(metric => (
          <div key={metric.label} className="flex items-baseline gap-4">
            <dt className="text-brand-gray-700 text-sm">{metric.label}</dt>
            <dd className={statisticsMetricValueClass}>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
