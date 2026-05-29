export {
  useIdeasDashboard,
  useIdeasDashboardPreferences,
  useIdeasDashboardQuery,
} from './hooks/use-ideas-dashboard';
export { IdeasDashboardPage } from './ui/page/IdeasDashboardPage';
export { DashboardHeader } from './ui/header/DashboardHeader';
export { LoadMoreFooter } from './ui/grid/LoadMoreFooter';
export { DashboardFilter } from './ui/header/DashboardFilter';
export { DashboardControls } from './ui/header/DashboardControls';
export { DashboardGrid } from './ui/grid/DashboardGrid';
export { DashboardCardStandard } from './ui/cards/DashboardCardStandard';
export { DashboardCardCompact } from './ui/cards/DashboardCardCompact';
export { DashboardCardStats } from './ui/cards/DashboardCardStats';
export { LinkedItemsSection } from './ui/linked-items/LinkedItemsSection';
export { LinkedItemMiniCard } from './ui/linked-items/LinkedItemMiniCard';
export type {
  DashboardCardBase,
  DashboardEngagementStats,
  DashboardFilterTab,
  DashboardLinkedItem,
  DashboardSortOption,
} from './model/dashboard.types';
export type {
  DashboardCardView,
  IdeaDashboardCard,
  IdeaDashboardFilter,
  IdeaDashboardSort,
  ProblemDashboardFilter,
  ProblemDashboardSort,
} from './model/ideas-dashboard.types';
export type { DashboardViewport } from './lib/layout/dashboard-grid-layout';
export {
  getColumnSelectMax,
  getEffectiveColumnCount,
  resolveDashboardViewport,
} from './lib/layout/dashboard-grid-layout';
export {
  COLUMN_COUNT_MAX,
  COLUMN_COUNT_MIN,
  COMPACT_CARD_COLUMN_THRESHOLD,
  DASHBOARD_CARD_TAG_TO_SHOW_COUNT,
  DEFAULT_COLUMN_COUNT,
  TABLET_COLUMN_COUNT_MAX,
} from './lib/config/constants';
export { IDEAS_DASHBOARD_LABELS } from './lib/config/ideas-dashboard-labels';
