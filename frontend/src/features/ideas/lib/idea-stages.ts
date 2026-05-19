export const IDEA_STAGES = [
  { value: 'ideation', label: 'Ideation' },
  { value: 'prototyping', label: 'Prototyping' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
] as const;

export type IdeaStage = (typeof IDEA_STAGES)[number]['value'];
