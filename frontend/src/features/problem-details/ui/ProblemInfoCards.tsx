import { formatCostBenefitDisplay } from '@/features/problem-details/lib/format-cost-benefit';

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
    <div className="grid gap-4 sm:grid-cols-2">
      {valueProposition ? (
        <article className="border-brand-gray-200 bg-card rounded-lg border p-4 sm:p-5">
          <h3 className="text-brand-dark-blue text-xs font-bold tracking-wide uppercase">
            Value proposition
          </h3>
          <p className="text-brand-gray-800 mt-2 text-sm leading-relaxed">
            {valueProposition}
          </p>
        </article>
      ) : null}

      {formattedCost ? (
        <article className="border-brand-gray-200 bg-card rounded-lg border p-4 sm:p-5">
          <h3 className="text-brand-dark-blue text-xs font-bold tracking-wide uppercase">
            Potential cost benefit
          </h3>
          <p className="text-brand-gray-800 mt-2 text-sm font-semibold tabular-nums">
            {formattedCost}
          </p>
        </article>
      ) : null}
    </div>
  );
}
