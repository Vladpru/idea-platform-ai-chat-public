import type { ApiStage, IdeaStatus } from '@/features/ideas/model/idea.types';
import type {
  DashboardCardBase,
  DashboardLinkedItem,
} from '@/shared/dashboard/model/dashboard.types';

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
  | 'views'
  | 'likes'
  | 'comments';

export type IdeaDashboardLinkedProblem = DashboardLinkedItem;

export type IdeaDashboardCard =
  DashboardCardBase<IdeaDashboardLinkedProblem> & {
    stageValue: ApiStage | null;
    publishedAt: string | null;
    status: IdeaStatus;
    isAuthor: boolean;
    isLiked: boolean;
  };

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
