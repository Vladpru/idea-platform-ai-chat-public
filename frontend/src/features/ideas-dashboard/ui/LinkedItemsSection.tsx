import { ChevronUp } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/shared/lib/utils';

import type { DashboardLinkedItem } from '../model/dashboard.types';
import { LinkedItemMiniCard } from './LinkedItemMiniCard';

type LinkedItemsSectionProps = {
  items: DashboardLinkedItem[];
  sectionLabel: string;
  getItemDetailHref: (id: string) => string;

  expanded: boolean;
  onToggleExpanded?: () => void;
  showToggle?: boolean;
  compact?: boolean;
  className?: string;
  linkedItemEmptyImageText?: string;
};

export function LinkedItemsSection({
  items,
  sectionLabel,
  getItemDetailHref,

  expanded,
  onToggleExpanded,
  showToggle = true,
  compact = false,
  className,
  linkedItemEmptyImageText,
}: LinkedItemsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !expanded) return;

    let isScrolling = false;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;

      const isScrollable =
        scrollContainer.scrollWidth > scrollContainer.clientWidth;
      if (!isScrollable) return;

      const atLeftEdge = scrollContainer.scrollLeft <= 0 && e.deltaY < 0;
      const atRightEdge =
        scrollContainer.scrollLeft + scrollContainer.clientWidth >=
          scrollContainer.scrollWidth && e.deltaY > 0;

      if (!atLeftEdge && !atRightEdge) {
        e.preventDefault();

        if (!isScrolling) {
          isScrolling = true;
          requestAnimationFrame(() => {
            scrollContainer.scrollBy({
              left: e.deltaY * 0.8,
              behavior: 'smooth',
            });
            setTimeout(() => {
              isScrolling = false;
            }, 50);
          });
        }
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, [expanded]);

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
            className="flex h-full scrollbar-none gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollBehavior: 'smooth' }}
          >
            {items.map(item => (
              <LinkedItemMiniCard
                key={item.id}
                item={item}
                detailHref={getItemDetailHref(item.id)}
                compact={compact}
                emptyImageText={linkedItemEmptyImageText}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
