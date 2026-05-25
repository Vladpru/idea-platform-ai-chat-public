import type { ApiStage } from '@/features/ideas/model/idea.types';

import type {
  DashboardCardBase,
  DashboardLinkedItem,
} from './dashboard.types';

export type IdeaDashboardFilter =
  | 'ALL'
  | 'IDEATION'
  | 'PROTOTYPING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'ARCHIVED';

export type IdeaDashboardSort =
  | 'newest'
  | 'oldest'
  | 'title-asc'
  | 'title-desc';

export type IdeaDashboardLinkedProblem = DashboardLinkedItem;

export type IdeaDashboardCard = DashboardCardBase<IdeaDashboardLinkedProblem> & {
  stageValue: ApiStage | null;
  publishedAt: string | null;
};

export type ProblemDashboardFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ARCHIVED';

export type ProblemDashboardSort =
  | 'newest'
  | 'oldest'
  | 'most-viewed'
  | 'most-popular'
  | 'most-ideas-linked';

export type IdeaDashboardCardView = {
  domain: 'idea';
  card: IdeaDashboardCard;
};

export type ProblemDashboardCardView = {
  domain: 'problem';
  card: DashboardCardBase;
};

export type DashboardCardView =
  | IdeaDashboardCardView
  | ProblemDashboardCardView;
