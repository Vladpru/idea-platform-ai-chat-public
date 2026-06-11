import type { DashboardCardBase } from '@/shared/dashboard/model/dashboard.types';
import type {
  ProblemStage,
  ProblemStatus,
} from '@/features/problems/api/problems-api.types';

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
  | 'most-ideas-linked'
  | 'comments';

export type ProblemDashboardCard = DashboardCardBase & {
  stageValue: ProblemStage | null;
  publishedAt: string | null;
  status: ProblemStatus;
  isAuthor: boolean;
  isLiked: boolean;
};
