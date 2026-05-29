import type { IdeasFeedResponse } from '@/features/ideas/api/ideas-api.types';
import type { InfiniteData } from '@tanstack/react-query';

import { toIdeaDashboardCard } from '../../model/ideas-dashboard.mapper';
import type { IdeaDashboardCard } from '../../model/ideas-dashboard.types';

export function selectIdeasDashboardCards(
  data: InfiniteData<IdeasFeedResponse>,
): IdeaDashboardCard[] {
  return data.pages.flatMap(page =>
    page.data.map(toIdeaDashboardCard),
  );
}
