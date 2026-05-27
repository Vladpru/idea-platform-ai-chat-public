import type {
  CreateProblemPayload,
  ProblemForm,
  ProblemStage,
  UpdateProblemPayload,
} from '@/features/problems/api/problems-api.types';

import { normalizeCostBenefitForApi } from './cost-benefit';
import { formatIdeaIds, parseIdeaIds } from './idea-ids';
import { PROBLEM_STAGES, type ProblemStageValue } from './stages';
import type { SubmitProblemFormValues } from './schema';

const problemStageValues = new Set<ProblemStageValue>(
  PROBLEM_STAGES.map(stage => stage.value),
);

function toFormStage(stage: ProblemStage | null): ProblemStageValue {
  if (stage && problemStageValues.has(stage as ProblemStageValue)) {
    return stage as ProblemStageValue;
  }
  return 'active';
}

function parseTagLabels(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const labels = value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
  return labels.length > 0 ? labels : undefined;
}

export function problemFormToSubmitFormValues(
  problem: ProblemForm,
): SubmitProblemFormValues {
  return {
    stage: toFormStage(problem.stage),
    title: problem.title?.trim() ?? '',
    description: problem.description?.trim() ?? '',
    valueProposition: problem.valueProposition?.trim() ?? '',
    costBenefit: problem.costBenefit?.trim() ?? '',
    ideaIds: formatIdeaIds(problem.ideas.map(idea => idea.id)),
    tags: problem.tags.map(tag => tag.name).join(', '),
    files: [],
  };
}

export function formValuesToUpdateProblemPayload(
  values: SubmitProblemFormValues,
): UpdateProblemPayload {
  const { isPublished: _isPublished, ...payload } = formValuesToCreateProblemPayload(
    values,
    false,
  );
  return payload;
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
