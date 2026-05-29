import type { StatusChangeItem } from '../model/statistics.types';

import { statisticsCardClass } from './statistics-classes';

type StatusChangesCardProps = {
  statusChanges: StatusChangeItem[];
};

export function StatusChangesCard({ statusChanges }: StatusChangesCardProps) {
  return (
    <section className={`${statisticsCardClass} h-full w-full`}>
      <h2 className="text-brand-dark-blue mb-5 text-lg font-bold">Status changes</h2>
      <ul className="flex flex-col gap-5">
        {statusChanges.map((item) => (
          <li key={item.label} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-brand-gray-700 text-sm font-medium">
                {item.label}
              </span>
              <span className="text-brand-dark-blue shrink-0 text-sm font-semibold tabular-nums">
                {item.percent}%
              </span>
            </div>
            <div
              className="bg-brand-gray-200 h-2 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={item.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item.label}: ${item.percent}%`}
            >
              <div
                className="bg-brand-dark-blue h-full rounded-full transition-[width]"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
