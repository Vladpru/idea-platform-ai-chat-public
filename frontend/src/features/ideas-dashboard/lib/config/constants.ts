import type { ApiStage } from '@/features/ideas/model/idea.types';
import {
  COLUMN_COUNT_MAX,
  COLUMN_COUNT_MIN,
  COMPACT_CARD_COLUMN_THRESHOLD,
  DASHBOARD_CARD_TAG_TO_SHOW_COUNT,
  DEFAULT_COLUMN_COUNT,
  STATS_BELOW_TAGS_COLUMN_THRESHOLD,
  TABLET_COLUMN_COUNT_MAX,
  TABLET_COLUMN_GRID_CLASSES,
  type DashboardTabletColumnLayout,
} from '@/shared/dashboard/lib/config/constants';

import type {
  IdeaDashboardFilter,
  IdeaDashboardSort,
} from '../../model/ideas-dashboard.types';

export {
  COLUMN_COUNT_MAX,
  COLUMN_COUNT_MIN,
  COMPACT_CARD_COLUMN_THRESHOLD,
  DASHBOARD_CARD_TAG_TO_SHOW_COUNT,
  DEFAULT_COLUMN_COUNT,
  STATS_BELOW_TAGS_COLUMN_THRESHOLD,
  TABLET_COLUMN_COUNT_MAX,
  TABLET_COLUMN_GRID_CLASSES,
  type DashboardTabletColumnLayout,
};

export const IDEA_DASHBOARD_FILTERS: {
  id: IdeaDashboardFilter;
  label: string;
}[] = [
  { id: 'ALL', label: 'All' },
  { id: 'IDEATION', label: 'Ideation' },
  { id: 'PROTOTYPING', label: 'Prototyping' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'PAUSED', label: 'Paused' },
  { id: 'ARCHIVED', label: 'Archived' },
];

export const FILTER_TO_API_STAGE: Record<
  Exclude<IdeaDashboardFilter, 'ALL'>,
  ApiStage
> = {
  IDEATION: 'ideation',
  PROTOTYPING: 'prototyping',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
};

export const API_STAGE_TO_FILTER: Record<ApiStage, IdeaDashboardFilter> = {
  ideation: 'IDEATION',
  prototyping: 'PROTOTYPING',
  completed: 'COMPLETED',
  paused: 'PAUSED',
  archived: 'ARCHIVED',
};

export const IDEA_DASHBOARD_SORT_OPTIONS: {
  value: IdeaDashboardSort;
  label: string;
}[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'likes', label: 'Most Popular' },
  { value: 'comments', label: 'Most Commented' },
];
