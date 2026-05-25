import type { IdeasFeedResponse } from '@/features/ideas/api/ideas-api.types';
import type { InfiniteData } from '@tanstack/react-query';

import { sortIdeaDashboardCards } from './sort-ideas';
import { toIdeaDashboardCard } from '../model/ideas-dashboard.mapper';
import type { IdeaDashboardCard, IdeaDashboardSort } from '../model/ideas-dashboard.types';

export function selectIdeasDashboardCards(
  data: InfiniteData<IdeasFeedResponse>,
  sort: IdeaDashboardSort,
): IdeaDashboardCard[] {
  const cards = data.pages.flatMap(page =>
    page.data.map(toIdeaDashboardCard),
  );
  return sortIdeaDashboardCards(cards, sort);
}
