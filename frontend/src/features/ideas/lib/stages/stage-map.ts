import type { ApiStage } from '@/features/ideas/model/idea.types';

import type { IdeaStage } from './stages';

const API_TO_FORM: Record<ApiStage, IdeaStage> = {
  IDEATION: 'ideation',
  PROTOTYPING: 'prototyping',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
};

const FORM_TO_API: Record<IdeaStage, ApiStage> = {
  ideation: 'IDEATION',
  prototyping: 'PROTOTYPING',
  completed: 'COMPLETED',
  paused: 'PAUSED',
  archived: 'ARCHIVED',
};

export function apiStageToFormStage(stage: ApiStage | null): IdeaStage | null {
  if (!stage) return null;
  return API_TO_FORM[stage] ?? null;
}

export function formStageToApiStage(stage: IdeaStage | null): ApiStage | null {
  if (!stage) return null;
  return FORM_TO_API[stage] ?? null;
}
