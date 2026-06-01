import { SkeletonCard } from '@/shared/ui/skeleton';

import {
  getEffectiveColumnCount,
  getIsCompactLayout,
  type DashboardViewport,
} from '../../lib/layout/dashboard-grid-layout';
import {
  getVirtualRowGridContainerClassName,
  getVirtualRowGridStyle,
} from '../../lib/layout/dashboard-virtualization';

export type DashboardGridSkeletonProps = {
  columnCount: number;
  viewport: DashboardViewport;
  standardCardClassName?: string;
  compactCardClassName?: string;
  /** Number of skeleton rows to render (defaults to 2). */
  rowCount?: number;
};

export function DashboardGridSkeleton({
  columnCount,
  viewport,
  standardCardClassName = 'h-80',
  compactCardClassName = 'min-h-[380px]',
  rowCount = 2,
}: DashboardGridSkeletonProps) {
  const effectiveColumnCount = getEffectiveColumnCount(columnCount, viewport);
  const isCompactLayout = getIsCompactLayout(effectiveColumnCount, viewport);
  const skeletonCount = Math.max(effectiveColumnCount * rowCount, 4);
  const cardClassName = isCompactLayout
    ? compactCardClassName
    : standardCardClassName;

  const gridClassName = getVirtualRowGridContainerClassName(
    effectiveColumnCount,
    isCompactLayout,
  );
  const gridStyle = getVirtualRowGridStyle(effectiveColumnCount);

  const desktopMinWidth =
    viewport === 'desktop'
      ? `min(100%, ${effectiveColumnCount * (isCompactLayout ? 160 : 280)}px)`
      : undefined;

  return (
    <div
      className={gridClassName}
      style={{ ...gridStyle, minWidth: desktopMinWidth }}
      aria-busy
      aria-label="Loading"
    >
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <SkeletonCard key={index} className={cardClassName} />
      ))}
    </div>
  );
}
