import { formatCostBenefitDisplay } from '@/features/problem-details/lib/format-cost-benefit';

import { entityDescriptionTextClass } from '@/shared/lib/entity-description-classes';
import { cn } from '@/shared/lib/utils';

type ProblemInfoCardsProps = {
  valueProposition: string | null;
  costBenefit: string | null;
};

export function ProblemInfoCards({
  valueProposition,
  costBenefit,
}: ProblemInfoCardsProps) {
  const formattedCost = formatCostBenefitDisplay(costBenefit);

  if (!valueProposition && !formattedCost) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-5">
      {valueProposition && (
        <article className="border-brand-gray-200 bg-brand-gray-50 col-span-3 rounded-xs border p-4 sm:p-5">
          <h3 className="text-brand-dark-blue text-base font-bold tracking-wide uppercase">
            Value proposition
          </h3>
          <p className={cn(entityDescriptionTextClass, 'mt-2')}>
            {valueProposition}
          </p>
        </article>
      )}

      {formattedCost && (
        <article className="border-brand-gray-200 bg-brand-gray-50 col-span-2 max-h-23 rounded-xs border p-4 sm:p-5">
          <h3 className="text-brand-dark-blue text-base font-bold tracking-wide uppercase">
            Potential cost benefit
          </h3>
          <p className="text-brand-gray-800 mt-2 text-sm font-semibold tabular-nums">
            {formattedCost}
          </p>
        </article>
      )}
    </div>
  );
}
