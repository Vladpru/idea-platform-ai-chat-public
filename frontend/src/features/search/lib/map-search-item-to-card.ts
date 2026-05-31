import type { DashboardCardBase } from '@/features/ideas-dashboard';

import type { GlobalSearchResultItem } from '../api/search.types';

export function mapSearchItemToDashboardCard(
  item: GlobalSearchResultItem,
): DashboardCardBase {
  return {
    id: item.id,
    authorId: item.authorId,
    title: item.title,
    description: item.excerpt,
    imageUrl: item.imageUrl,
    authorName: item.authorName,
    authorAvatarUrl: item.authorAvatarUrl,
    stage: item.stage ?? '',
    tags: item.tags.map(tag => tag.name),
    stats: item.stats,
    linkedItems: [],
  };
}
