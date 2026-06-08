export const SCORING_ACTION_NAMES = [
  'LIKE_IDEA',
  'CREATE_IDEA',
  'CREATE_IDEA_COMMENT',
  'JOIN_IDEA',
  'VIEW_IDEA',
  'CREATE_IDEA_UPDATE',
] as const;

export type ScoringActionName = (typeof SCORING_ACTION_NAMES)[number];

export type ScoringWeights = Record<ScoringActionName, number>;

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  LIKE_IDEA: 3,
  CREATE_IDEA: 50,
  CREATE_IDEA_COMMENT: 5,
  JOIN_IDEA: 20,
  VIEW_IDEA: 1,
  CREATE_IDEA_UPDATE: 15,
};
