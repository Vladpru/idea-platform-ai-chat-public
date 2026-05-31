export {
  useIdeasDashboard,
  useIdeasDashboardPreferences,
  useIdeasDashboardQuery,
} from './hooks/use-ideas-dashboard';
export { IdeasDashboardPage } from './ui/page/IdeasDashboardPage';
export { DashboardHeader } from './ui/header/DashboardHeader';
export { DashboardCardStandard } from './ui/cards/DashboardCardStandard';
export { DashboardCardCompact } from './ui/cards/DashboardCardCompact';
export type {
  IdeaDashboardCard,
  IdeaDashboardFilter,
  IdeaDashboardSort,
} from './model/ideas-dashboard.types';
export type { DashboardCardView } from './model/ideas-dashboard.types';
export { IDEAS_DASHBOARD_LABELS } from './lib/config/ideas-dashboard-labels';

export {
  DashboardGrid,
  DashboardControls,
  DashboardFilter,
  DashboardCardStats,
  LinkedItemsSection,
  LinkedItemMiniCard,
  LoadMoreFooter,
  COLUMN_COUNT_MAX,
  COLUMN_COUNT_MIN,
  COMPACT_CARD_COLUMN_THRESHOLD,
  DASHBOARD_CARD_TAG_TO_SHOW_COUNT,
  DEFAULT_COLUMN_COUNT,
  TABLET_COLUMN_COUNT_MAX,
  getColumnSelectMax,
  getEffectiveColumnCount,
  resolveDashboardViewport,
} from '@/shared/dashboard';
export type {
  DashboardCardBase,
  DashboardEngagementStats,
  DashboardFilterTab,
  DashboardLinkedItem,
  DashboardSortOption,
  DashboardViewport,
} from '@/shared/dashboard';
