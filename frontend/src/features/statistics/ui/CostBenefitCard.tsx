import { cn } from '@/shared/lib/utils';
import { DollarSign } from 'lucide-react';

import { formatStatisticsCostBenefit } from '../lib/format-statistics-values';

import { statisticsCardClass, statisticsIconTileClass } from './statistics-classes';

type CostBenefitCardProps = {
  total: number;
  isFetching?: boolean;
};

export function CostBenefitCard({
  total,
  isFetching = false,
}: CostBenefitCardProps) {
  return (
    <section
      className={cn(
        `${statisticsCardClass} h-full w-full`,
        isFetching && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={statisticsIconTileClass}>
          <DollarSign className="size-5" aria-hidden />
        </span>
        <h2 className="text-brand-dark-blue text-lg font-bold">Cost Benefit</h2>
      </div>

      <p className="text-brand-dark-blue mt-6 text-3xl font-bold tracking-tight tabular-nums">
        {formatStatisticsCostBenefit(total)}
      </p>
      <p className="text-brand-gray-600 mt-3 text-sm leading-relaxed">
        Overall potential financial impact across all problems for the chosen
        date range
      </p>
    </section>
  );
}
