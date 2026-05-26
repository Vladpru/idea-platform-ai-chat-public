import { cn } from '@/shared/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { LRUCache } from '@/shared/utils/lru-cache';

type IdeaTagCloudProps = {
  tags: string[];
  className?: string;
  showAll?: boolean;
  tagToShowCount?: number;
  compact?: boolean;
};

const getCounterWidth = (compact: boolean) => (compact ? 28 : 36);
const getGap = (compact: boolean) => (compact ? 4 : 8);

const getTagClass = (compact: boolean, showAll: boolean) =>
  cn(
    'font-arial inline-flex items-center rounded-lg border overflow-hidden truncate font-normal min-w-0',
    showAll ? 'max-w-full' : compact ? 'max-w-[80px]' : 'max-w-[120px]',
    compact && !showAll
      ? 'px-1.5 py-0.5 text-[10px]'
      : 'px-1.75 py-0.75 text-xs',
  );

const getCounterClass = (compact: boolean) =>
  cn(
    'bg-brand-gray-200 text-brand-gray-600 font-arial inline-flex shrink-0 items-center rounded-lg border font-bold',
    compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-1.75 py-0.75 text-xs',
  );

const tagWidthCache = new LRUCache<string, number>(1000);
let rulerContainer: HTMLElement | null = null;

function getRulerContainer(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (rulerContainer) return rulerContainer;

  rulerContainer = document.createElement('div');
  rulerContainer.style.position = 'absolute';
  rulerContainer.style.visibility = 'hidden';
  rulerContainer.style.pointerEvents = 'none';
  rulerContainer.style.display = 'flex';
  rulerContainer.style.gap = '0px';

  document.body.appendChild(rulerContainer);
  return rulerContainer;
}

function measureTagsBatched(
  texts: string[],
  compact: boolean,
): Map<string, number> {
  const results = new Map<string, number>();
  const toMeasure: string[] = [];

  for (const text of texts) {
    const cacheKey = `${compact ? 'c' : 's'}_${text}`;
    const cached = tagWidthCache.get(cacheKey);
    if (cached !== undefined) {
      results.set(text, cached);
    } else {
      toMeasure.push(text);
    }
  }

  if (toMeasure.length === 0) return results;

  const container = getRulerContainer();
  if (!container) return results;

  container.innerHTML = '';
  const spans: { text: string; el: HTMLElement }[] = [];
  const tagClass = getTagClass(compact, false);

  for (const text of toMeasure) {
    const span = document.createElement('span');
    span.className = tagClass;
    span.style.whiteSpace = 'nowrap';
    span.textContent = text;
    container.appendChild(span);
    spans.push({ text, el: span });
  }

  for (const { text, el } of spans) {
    const width = el.getBoundingClientRect().width;
    const cacheKey = `${compact ? 'c' : 's'}_${text}`;
    tagWidthCache.set(cacheKey, width);
    results.set(text, width);
  }

  container.innerHTML = '';
  return results;
}

function calculateVisibleCount(
  tags: string[],
  containerWidth: number,
  compact: boolean,
): number {
  const measuredWidths = measureTagsBatched(tags, compact);
  const gap = getGap(compact);
  const counterWidth = getCounterWidth(compact);

  let usedWidth = 0;
  let count = 0;

  for (let i = 0; i < tags.length; i++) {
    const tagWidth = measuredWidths.get(tags[i]) || 0;
    const spacing = count > 0 ? gap : 0;
    const isLastTag = i === tags.length - 1;
    const counterReserve = isLastTag ? 0 : counterWidth + gap;
    const needed = usedWidth + spacing + tagWidth + counterReserve;

    if (needed > containerWidth) break;

    usedWidth += spacing + tagWidth;
    count++;
  }

  return Math.max(1, count);
}

const observerCallbacks = new Map<Element, (width: number) => void>();
let globalObserver: ResizeObserver | null = null;

function getGlobalObserver() {
  if (typeof window === 'undefined') return null;
  if (!globalObserver) {
    globalObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cb = observerCallbacks.get(entry.target);
        if (cb) cb(entry.contentRect.width);
      }
    });
  }
  return globalObserver;
}

function observeResize(el: Element, cb: (w: number) => void) {
  const obs = getGlobalObserver();
  if (!obs) return () => {};

  observerCallbacks.set(el, cb);
  obs.observe(el);

  return () => {
    observerCallbacks.delete(el);
    obs.unobserve(el);
  };
}

export function IdeaTagCloud({
  tags,
  className,
  showAll = false,
  tagToShowCount,
  compact = false,
}: IdeaTagCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isHardcodedCount = tagToShowCount !== undefined;
  const useAlgorithm = !showAll && !isHardcodedCount;

  const [visibleCount, setVisibleCount] = useState(
    isHardcodedCount ? tagToShowCount : tags.length,
  );
  const [isCalculated, setIsCalculated] = useState(!useAlgorithm);

  useEffect(() => {
    if (!useAlgorithm || tags.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const initialWidth = container.getBoundingClientRect().width;
    if (initialWidth > 0) {
      setVisibleCount(calculateVisibleCount(tags, initialWidth, compact));
      setIsCalculated(true);
    }

    const unobserve = observeResize(container, width => {
      if (width === 0) return;
      setVisibleCount(calculateVisibleCount(tags, width, compact));
      setIsCalculated(true);
    });

    return unobserve;
  }, [tags, useAlgorithm, compact]);

  if (!tags?.length) return null;

  const currentVisibleCount = showAll
    ? tags.length
    : isHardcodedCount
      ? tagToShowCount
      : isCalculated
        ? visibleCount
        : tags.length;

  const remaining = Math.max(0, tags.length - currentVisibleCount);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col',
        useAlgorithm && 'flex-1 overflow-hidden',
        !isCalculated && useAlgorithm && 'opacity-0',
        className,
      )}
    >
      <ul
        className={cn(
          'flex min-w-0 items-center',
          showAll ? 'flex-wrap' : 'flex-nowrap',
          compact ? 'gap-1' : 'gap-2',
        )}
        aria-label="Idea tags"
      >
        {tags.slice(0, currentVisibleCount).map(tag => (
          <li key={tag} className="min-w-0 shrink-0">
            <span
              className={cn(
                getTagClass(compact, showAll),
                'bg-brand-gray-200 text-brand-gray-600 block truncate',
              )}
              title={tag}
            >
              {tag}
            </span>
          </li>
        ))}

        {remaining > 0 && (
          <li className="shrink-0">
            <span className={getCounterClass(compact)}>+{remaining}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
