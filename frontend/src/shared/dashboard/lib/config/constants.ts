export const COLUMN_COUNT_MIN = 1;
export const COLUMN_COUNT_MAX = 8;
export const TABLET_COLUMN_COUNT_MAX = 3;
export const COMPACT_CARD_COLUMN_THRESHOLD = 6;
/** Standard cards stack engagement stats below tags at this column count and above. */
export const STATS_BELOW_TAGS_COLUMN_THRESHOLD = 4;
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
