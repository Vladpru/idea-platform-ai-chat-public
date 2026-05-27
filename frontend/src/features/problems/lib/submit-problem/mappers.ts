import type { CreateProblemPayload } from '@/features/problems/api/problems-api.types';

import { normalizeCostBenefitForApi } from './cost-benefit';
import { formatIdeaIds, parseIdeaIds } from './idea-ids';
import type { SubmitProblemFormValues } from './schema';

function parseTagLabels(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const labels = value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
  return labels.length > 0 ? labels : undefined;
}

export function formValuesToCreateProblemPayload(
  values: SubmitProblemFormValues,
  isPublished: boolean,
): CreateProblemPayload {
  const ideaIds = parseIdeaIds(values.ideaIds);
  const tagLabels = parseTagLabels(values.tags);
  const valueProposition = values.valueProposition?.trim();
  const costBenefit = normalizeCostBenefitForApi(values.costBenefit);

  return {
    isPublished,
    stage: values.stage,
    title: values.title.trim(),
    description: (values.description ?? '').trim(),
    ...(valueProposition ? { valueProposition } : {}),
    ...(costBenefit ? { costBenefit } : {}),
    ...(ideaIds.length > 0 ? { ideaIds } : {}),
    ...(tagLabels ? { tagLabels } : {}),
  };
}

export { formatIdeaIds, parseIdeaIds };
