import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from 'react';

import { chunkDashboardRows } from '../../lib/layout/chunk-dashboard-rows';
import {
  DASHBOARD_VIRTUAL_ROW_GAP_PX,
  getEstimatedDashboardRowHeight,
  getVirtualRowGridContainerClassName,
  getVirtualRowGridStyle,
} from '../../lib/layout/dashboard-virtualization';
import {
  getIsCompactLayout,
  getStandardCardLayout,
  type DashboardViewport,
} from '../../lib/layout/dashboard-grid-layout';
import type { DashboardCardBase } from '../../model/dashboard.types';

export type DashboardGridProps<TCard extends DashboardCardBase> = {
  items: TCard[];
  columnCount: number;
  viewport: DashboardViewport;
  linkedItemsExpanded: boolean;
  emptyMessage: string;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPageRef: MutableRefObject<boolean>;
  renderCompactCard: (
    card: TCard,
    options: { forceShowLinkedItems: boolean; columnCount: number },
  ) => ReactNode;

  renderStandardCard: (
    card: TCard,
    options: {
      layout: 'vertical' | 'horizontal';
      linkedItemsExpanded: boolean;
      onToggleLinkedItems: (cardId: string) => void;
      columnCount: number;
    },
  ) => ReactNode;
};

function DashboardGridInner<TCard extends DashboardCardBase>({
  items,
  columnCount,
  viewport,
  linkedItemsExpanded,
  emptyMessage,
  onLoadMore,
  hasNextPage,
  isFetchingNextPageRef,
  renderCompactCard,
  renderStandardCard,
}: DashboardGridProps<TCard>) {
  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const [gridOffset, setGridOffset] = useState(0);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const effectiveColumnCount =
    viewport === 'mobile'
      ? 1
      : viewport === 'tablet'
        ? Math.min(columnCount, 3)
        : columnCount;

  const isCompactLayout = getIsCompactLayout(effectiveColumnCount, viewport);
  const standardCardLayout = getStandardCardLayout(
    effectiveColumnCount,
    viewport,
  );

  const chunkedRows = useMemo(
    () => chunkDashboardRows(items, effectiveColumnCount),
    [items, effectiveColumnCount],
  );

  const estimatedRowHeight = useMemo(
    () =>
      getEstimatedDashboardRowHeight({
        isCompactLayout,
        standardCardLayout,
        linkedItemsExpanded,
      }),
    [isCompactLayout, linkedItemsExpanded, standardCardLayout],
  );

  const virtualizer = useWindowVirtualizer({
    count: chunkedRows.length,
    estimateSize: () => estimatedRowHeight,
    gap: DASHBOARD_VIRTUAL_ROW_GAP_PX,
    scrollMargin: gridOffset,
    overscan: 2,
  });

  const rowGridClassName = getVirtualRowGridContainerClassName(
    effectiveColumnCount,
    isCompactLayout,
  );
  const rowGridStyle = getVirtualRowGridStyle(effectiveColumnCount);

  const desktopMinWidth =
    viewport === 'desktop'
      ? `min(100%, ${effectiveColumnCount * (isCompactLayout ? 160 : 280)}px)`
      : undefined;

  const [perCardExpanded, setPerCardExpanded] = useState<
    Record<string, boolean>
  >({});
  const [prevLinkedExpanded, setPrevLinkedExpanded] =
    useState(linkedItemsExpanded);

  if (linkedItemsExpanded !== prevLinkedExpanded) {
    setPrevLinkedExpanded(linkedItemsExpanded);
    setPerCardExpanded({});
  }

  const isCardLinkedExpanded = useCallback(
    (cardId: string) => perCardExpanded[cardId] ?? linkedItemsExpanded,
    [linkedItemsExpanded, perCardExpanded],
  );

  const toggleCardLinked = useCallback(
    (cardId: string) => {
      setPerCardExpanded(prev => {
        const current = prev[cardId] ?? linkedItemsExpanded;
        return { ...prev, [cardId]: !current };
      });
    },
    [linkedItemsExpanded],
  );

  useLayoutEffect(() => {
    const updateGridOffset = () => {
      if (gridRef.current) {
        setGridOffset(gridRef.current.offsetTop);
      }
    };

    updateGridOffset();
    window.addEventListener('resize', updateGridOffset);
    return () => window.removeEventListener('resize', updateGridOffset);
  }, [chunkedRows.length, effectiveColumnCount, viewport]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry?.isIntersecting) {
          return;
        }
        if (!hasNextPage || isFetchingNextPageRef.current) {
          return;
        }
        onLoadMoreRef.current();
      },
      { root: null, rootMargin: '240px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPageRef, items.length]);

  if (items.length === 0) {
    return (
      <p className="text-brand-gray-600 py-16 text-center text-sm">
        {emptyMessage}
      </p>
    );
  }

  const virtualScrollMargin = virtualizer.options.scrollMargin;

  const virtualList = (
    <div
      ref={gridRef}
      className="relative w-full"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {virtualizer.getVirtualItems().map(virtualRow => {
        const rowCards = chunkedRows[virtualRow.index];
        if (!rowCards) {
          return null;
        }

        const rowStyle: CSSProperties = {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualRow.start - virtualScrollMargin}px)`,
          minWidth: desktopMinWidth,
        };

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={rowStyle}
          >
            <div className={rowGridClassName} style={rowGridStyle}>
              {rowCards.map(card =>
                isCompactLayout ? (
                  <div key={card.id} className="h-full">
                    {renderCompactCard(card, {
                      forceShowLinkedItems: linkedItemsExpanded,
                      columnCount: effectiveColumnCount,
                    })}
                  </div>
                ) : (
                  <div key={card.id} className="h-full">
                    {renderStandardCard(card, {
                      layout: standardCardLayout,
                      linkedItemsExpanded: isCardLinkedExpanded(card.id),
                      onToggleLinkedItems: toggleCardLinked,
                      columnCount: effectiveColumnCount,
                    })}
                  </div>
                ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const gridWithSentinel = (
    <div className="w-full">
      {virtualList}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
    </div>
  );

  if (viewport === 'desktop') {
    return <div className="overflow-x-auto pb-1">{gridWithSentinel}</div>;
  }

  return gridWithSentinel;
}

function areDashboardGridPropsEqual<TCard extends DashboardCardBase>(
  prev: DashboardGridProps<TCard>,
  next: DashboardGridProps<TCard>,
): boolean {
  return (
    prev.items === next.items &&
    prev.columnCount === next.columnCount &&
    prev.viewport === next.viewport &&
    prev.linkedItemsExpanded === next.linkedItemsExpanded &&
    prev.emptyMessage === next.emptyMessage &&
    prev.onLoadMore === next.onLoadMore &&
    prev.hasNextPage === next.hasNextPage &&
    prev.isFetchingNextPageRef === next.isFetchingNextPageRef &&
    prev.renderCompactCard === next.renderCompactCard &&
    prev.renderStandardCard === next.renderStandardCard
  );
}

export const DashboardGrid = memo(
  DashboardGridInner,
  areDashboardGridPropsEqual,
) as typeof DashboardGridInner;
