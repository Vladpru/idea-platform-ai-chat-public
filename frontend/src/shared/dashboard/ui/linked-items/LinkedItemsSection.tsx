import { ChevronRight, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { COMPACT_CARD_COLUMN_THRESHOLD } from '@/shared/dashboard/lib/config/constants';
import type { DashboardLinkedItem } from '@/shared/dashboard/model/dashboard.types';
import { useHorizontalDragScroll } from '@/shared/hooks/use-horizontal-drag-scroll';
import { cn } from '@/shared/lib/utils';

import { LinkedItemMiniCard } from './LinkedItemMiniCard';
import { linkedItemsScrollContainerClass } from './linked-items.styles';

function getScrollHintOffsetClass(
  entityType: 'IDEA' | 'PROBLEM',
  columnCount: number,
): string {
  const compact = columnCount >= COMPACT_CARD_COLUMN_THRESHOLD;
  if (!compact) return 'right-[-23px]';
  if (entityType === 'PROBLEM') return 'right-[-8px]';
  return 'right-[-15px]';
}

type LinkedItemsSectionProps = {
  items: DashboardLinkedItem[];
  sectionLabel: string;
  getItemDetailHref: (id: string) => string;
  entityType: 'IDEA' | 'PROBLEM';
  expanded: boolean;
  onToggleExpanded?: () => void;
  showToggle?: boolean;
  columnCount?: number;
  className?: string;
  linkedItemEmptyImageText?: string;
};

export function LinkedItemsSection({
  items,
  sectionLabel,
  getItemDetailHref,
  entityType,
  expanded,
  onToggleExpanded,
  showToggle = true,
  columnCount = 1,
  className,
  linkedItemEmptyImageText,
}: LinkedItemsSectionProps) {
  const [isScrollable, setIsScrollable] = useState(false);
  const { scrollRef, isDragging, suppressClickRef, dragScrollProps } =
    useHorizontalDragScroll(isScrollable);
  const compact = !showToggle;

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !expanded) return;

    const syncScrollable = () => {
      setIsScrollable(
        scrollContainer.scrollWidth > scrollContainer.clientWidth + 1,
      );
    };

    syncScrollable();
    const frameId = requestAnimationFrame(syncScrollable);

    scrollContainer.addEventListener('scroll', syncScrollable, {
      passive: true,
    });

    const resizeObserver = new ResizeObserver(syncScrollable);
    resizeObserver.observe(scrollContainer);

    return () => {
      cancelAnimationFrame(frameId);
      scrollContainer.removeEventListener('scroll', syncScrollable);
      resizeObserver.disconnect();
    };
  }, [expanded, items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        compact ? 'px-3 pt-2 pb-3' : 'px-4 pt-3 pb-4 sm:px-5',
        className,
      )}
    >
      {showToggle ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="text-brand-dark-blue hover:text-brand-orange mb-2 flex w-full items-center gap-1 text-left text-[11px] font-bold tracking-widest uppercase transition-colors"
        >
          <ChevronUp
            className={cn(
              'size-3.5 shrink-0 transition-transform',
              !expanded && 'rotate-180',
            )}
            aria-hidden
          />
          {sectionLabel}
        </button>
      ) : (
        <h4 className="text-brand-dark-blue mb-2 text-[11px] font-bold tracking-widest uppercase">
          {sectionLabel}
        </h4>
      )}

      {expanded ? (
        <div className="relative">
          <div
            ref={scrollRef}
            className={cn(
              linkedItemsScrollContainerClass,
              isScrollable && 'cursor-grab touch-pan-y',
              isDragging && 'cursor-grabbing select-none',
            )}
            {...dragScrollProps}
          >
            {items.map(item => (
              <LinkedItemMiniCard
                key={item.id}
                item={item}
                detailHref={getItemDetailHref(item.id)}
                entityType={entityType}
                columnCount={columnCount}
                emptyImageText={linkedItemEmptyImageText}
                suppressClickRef={
                  isScrollable ? suppressClickRef : undefined
                }
              />
            ))}
          </div>

          {isScrollable ? (
            <div
              className={cn(
                'pointer-events-none absolute inset-y-0 flex w-10 items-center justify-end bg-linear-to-l from-white via-white/90 to-transparent pr-1',
                getScrollHintOffsetClass(entityType, columnCount),
              )}
              aria-hidden
            >
              <ChevronRight className="text-brand-dark-blue size-4 shrink-0 opacity-90" />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
