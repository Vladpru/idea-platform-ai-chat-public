export const PROBLEM_STAGES = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
] as const;

export type ProblemStageValue = (typeof PROBLEM_STAGES)[number]['value'];
