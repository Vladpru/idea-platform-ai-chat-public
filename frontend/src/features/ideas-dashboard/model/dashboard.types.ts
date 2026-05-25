import type { IdeaDetailsStats } from '@/features/idea-details/model/idea-details.types';

export type DashboardEngagementStats = IdeaDetailsStats;

export type DashboardLinkedItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  stats: DashboardEngagementStats;
};

export type DashboardCardBase<
  TLinked extends DashboardLinkedItem = DashboardLinkedItem,
> = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  stage: string;
  tags: string[];
  stats: DashboardEngagementStats;
  linkedItems: TLinked[];
};

export type DashboardSortOption<TSort extends string = string> = {
  value: TSort;
  label: string;
};

export type DashboardFilterTab<TFilter extends string = string> = {
  id: TFilter;
  label: string;
};
