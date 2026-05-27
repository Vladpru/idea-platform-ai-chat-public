import type { ProblemsFeedResponse } from '@/features/problems/api/problems-api.types';
import type { InfiniteData } from '@tanstack/react-query';

import { toProblemDashboardCard } from '../model/problems-dashboard.mapper';
import type { ProblemDashboardCard } from '../model/problems-dashboard.types';

export function selectProblemsDashboardCards(
  data: InfiniteData<ProblemsFeedResponse>,
): ProblemDashboardCard[] {
  return data.pages.flatMap(page => page.data.map(toProblemDashboardCard));
}
