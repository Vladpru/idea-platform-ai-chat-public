import type { CSSProperties } from 'react';

import { cn } from '@/shared/lib/utils';

export const DASHBOARD_VIRTUAL_ROW_GAP_PX = 24;

export const DASHBOARD_VIRTUAL_ROW_HEIGHT = {
  compact: 420,
  standardVertical: 560,
  standardVerticalLinkedExpanded: 720,
  standardHorizontal: 520,
} as const;

export function getEstimatedDashboardRowHeight(options: {
  isCompactLayout: boolean;
  standardCardLayout: 'vertical' | 'horizontal';
  linkedItemsExpanded: boolean;
}): number {
  if (options.isCompactLayout) {
    return DASHBOARD_VIRTUAL_ROW_HEIGHT.compact;
  }
  if (options.standardCardLayout === 'horizontal') {
    return DASHBOARD_VIRTUAL_ROW_HEIGHT.standardHorizontal;
  }
  if (options.linkedItemsExpanded) {
    return DASHBOARD_VIRTUAL_ROW_HEIGHT.standardVerticalLinkedExpanded;
  }
  return DASHBOARD_VIRTUAL_ROW_HEIGHT.standardVertical;
}

const ROW_GRID_COLUMN_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
};

export function getVirtualRowGridClassName(columnCount: number): string {
  return ROW_GRID_COLUMN_CLASS[columnCount] ?? 'grid-cols-1';
}

export function getVirtualRowGridStyle(
  columnCount: number,
  isCompactLayout = false,
): CSSProperties | undefined {
  if (columnCount <= 3) {
    return undefined;
  }
  const minCardWidth = isCompactLayout ? 160 : 280;
  return {
    gridTemplateColumns: `repeat(${columnCount}, minmax(${minCardWidth}px, 1fr))`,
  };
}

export function getVirtualRowGridContainerClassName(
  columnCount: number,
  isCompactLayout: boolean,
): string {
  return cn(
    'grid w-full gap-6',
    getVirtualRowGridClassName(columnCount),
    isCompactLayout && 'gap-3',
  );
}
