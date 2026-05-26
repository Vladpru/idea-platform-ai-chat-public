import type { DashboardCardBase } from '@/features/ideas-dashboard';
import type { ProblemStage } from '@/features/problems/api/problems-api.types';

export type ProblemDashboardCard = DashboardCardBase & {
  stageValue: ProblemStage | null;
  publishedAt: string | null;
};
