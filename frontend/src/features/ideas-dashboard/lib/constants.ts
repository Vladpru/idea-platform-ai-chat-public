import type { ApiStage } from '@/features/ideas/model/idea.types';

import type {
  IdeaDashboardFilter,
  IdeaDashboardSort,
} from '../model/ideas-dashboard.types';

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

export const IDEA_DASHBOARD_SORT_OPTIONS: {
  value: IdeaDashboardSort;
  label: string;
}[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A–Z' },
  { value: 'title-desc', label: 'Title Z–A' },
];

export const COLUMN_COUNT_MIN = 1;
export const COLUMN_COUNT_MAX = 8;
export const TABLET_COLUMN_COUNT_MAX = 3;
export const COMPACT_CARD_COLUMN_THRESHOLD = 5;
export const DEFAULT_COLUMN_COUNT = 2;
export const DASHBOARD_CARD_TAG_TO_SHOW_COUNT = 3;

export type DashboardTabletColumnLayout = 1 | 2 | 3;

export const TABLET_COLUMN_GRID_CLASSES: Record<
  DashboardTabletColumnLayout,
  string
> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
};
