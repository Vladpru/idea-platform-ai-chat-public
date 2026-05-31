import {
  COLUMN_COUNT_MAX,
  COMPACT_CARD_COLUMN_THRESHOLD,
  TABLET_COLUMN_COUNT_MAX,
  TABLET_COLUMN_GRID_CLASSES,
  type DashboardTabletColumnLayout,
} from '../config/constants';

export type DashboardViewport = 'mobile' | 'tablet' | 'desktop';

export function resolveDashboardViewport(
  isMobile: boolean,
  isTablet: boolean,
): DashboardViewport {
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

export function getEffectiveColumnCount(
  columnCount: number,
  viewport: DashboardViewport,
): number {
  if (viewport === 'mobile') return 1;
  if (viewport === 'tablet') {
    return Math.min(columnCount, TABLET_COLUMN_COUNT_MAX);
  }
  return columnCount;
}

export function getColumnSelectMax(viewport: DashboardViewport): number {
  if (viewport === 'tablet') return TABLET_COLUMN_COUNT_MAX;
  return COLUMN_COUNT_MAX;
}

export function getIsCompactLayout(
  effectiveColumnCount: number,
  viewport: DashboardViewport,
): boolean {
  if (viewport === 'mobile') return false;
  if (viewport === 'tablet') return effectiveColumnCount === 3;
  return effectiveColumnCount >= COMPACT_CARD_COLUMN_THRESHOLD;
}

export function getStandardCardLayout(
  effectiveColumnCount: number,
  viewport: DashboardViewport,
): 'vertical' | 'horizontal' {
  if (viewport === 'desktop' && effectiveColumnCount === 1) {
    return 'horizontal';
  }
  return 'vertical';
}

export function getDashboardGridClassName(
  effectiveColumnCount: number,
  viewport: DashboardViewport,
): string {
  if (viewport === 'mobile') return 'grid-cols-1';
  if (viewport === 'tablet') {
    const tabletColumns = Math.min(
      effectiveColumnCount,
      TABLET_COLUMN_COUNT_MAX,
    ) as DashboardTabletColumnLayout;
    return TABLET_COLUMN_GRID_CLASSES[tabletColumns];
  }
  return 'grid-cols-1 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]';
}
