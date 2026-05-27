import { getInitials } from '@/features/idea-details/lib/get-initials';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import { Link } from '@tanstack/react-router';
import { memo, useCallback } from 'react';

import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

import {
  DASHBOARD_CARD_TAG_TO_SHOW_COUNT,
  STATS_BELOW_TAGS_COLUMN_THRESHOLD,
} from '../lib/constants';
import type { DashboardCardBase } from '../model/dashboard.types';
import { DashboardCardStats } from './DashboardCardStats';
import { LinkedItemsSection } from './LinkedItemsSection';

export type DashboardCardStandardProps<
  TCard extends DashboardCardBase = DashboardCardBase,
> = {
  card: TCard;
  detailHref: string;
  emptyDescriptionText: string;
  emptyImageText: string;
  linkedSectionLabel: string;
  getLinkedItemDetailHref: (id: string) => string;
  linkedItemsScrollLeftAriaLabel: string;
  layout: 'vertical' | 'horizontal';
  linkedItemsExpanded: boolean;
  onToggleLinkedItems?: (cardId: string) => void;
  tagToShowCount?: number;
  isMobile: boolean;
  columnCount?: number;
  showHeroImage?: boolean;
  linkedItemEmptyImageText?: string;
  actionMenu?: React.ReactNode;
  hideLinkedItems?: boolean;
};

function DashboardCardStandardInner<
  TCard extends DashboardCardBase = DashboardCardBase,
>({
  card,
  detailHref,
  emptyDescriptionText,
  emptyImageText,
  linkedSectionLabel,
  getLinkedItemDetailHref,
  layout,
  linkedItemsExpanded,
  onToggleLinkedItems,
  tagToShowCount = DASHBOARD_CARD_TAG_TO_SHOW_COUNT,
  isMobile,
  columnCount = 1,
  showHeroImage = true,
  linkedItemEmptyImageText,
  actionMenu,
  hideLinkedItems = false,
}: DashboardCardStandardProps<TCard>) {
  const isHorizontal = layout === 'horizontal' && showHeroImage;
  const hasLinkedItems =
    !hideLinkedItems && card.linkedItems && card.linkedItems.length > 0;
  const stackStatsBelowTags = columnCount >= STATS_BELOW_TAGS_COLUMN_THRESHOLD;

  const handleToggleLinked = useCallback(() => {
    onToggleLinkedItems?.(card.id);
  }, [card.id, onToggleLinkedItems]);

  return (
    <article
      className={cn(
        'group border-brand-gray-200 flex h-full w-full overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md',
        showHeroImage && isHorizontal
          ? 'min-h-[260px] flex-col sm:flex-row'
          : showHeroImage
            ? 'min-h-[400px] flex-col'
            : 'min-h-[280px] flex-col',
      )}
    >
      {showHeroImage ? (
        <Link
          to={detailHref}
          className={cn(
            'bg-brand-gray-100 focus-visible:ring-brand-dark-blue relative shrink-0 overflow-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            isHorizontal
              ? 'aspect-[16/10] w-full sm:aspect-auto sm:min-h-[260px] sm:w-[320px] lg:w-[400px]'
              : 'aspect-[16/10] w-full',
          )}
        >
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
          ) : (
            <div className="text-brand-gray-400 absolute inset-0 flex size-full items-center justify-center text-xs font-semibold uppercase">
              {emptyImageText}
            </div>
          )}
        </Link>
      ) : null}

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {actionMenu && (
          <div className="absolute top-4 right-4 z-20 sm:top-5 sm:right-5">
            {actionMenu}
          </div>
        )}

        <Link
          to={detailHref}
          className={cn(
            'focus-visible:ring-brand-dark-blue flex min-w-0 flex-1 flex-col justify-between text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            isHorizontal ? 'p-4 sm:p-5 lg:p-6' : 'p-4 sm:p-5',
          )}
        >
          <div className="space-y-2 sm:space-y-3">
            <h3
              className={cn(
                'text-brand-black group-hover:text-brand-dark-blue font-bold tracking-wide transition-colors',
                isHorizontal
                  ? 'line-clamp-2 text-sm sm:line-clamp-1 sm:text-base'
                  : 'line-clamp-2 text-base',
                actionMenu && 'pr-10 sm:pr-12',
              )}
            >
              {card.title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar size="sm" className="ring-2 ring-white">
                  {card.authorAvatarUrl ? (
                    <AvatarImage
                      src={card.authorAvatarUrl}
                      alt={card.authorName}
                    />
                  ) : null}
                  <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-[10px] font-semibold">
                    {getInitials(card.authorName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-brand-gray-600 line-clamp-1 text-xs font-medium">
                  {card.authorName}
                </span>
              </div>
              <StageChevronBadge stage={card.stage} stageText={false} />
            </div>

            <p className="text-brand-gray-600 line-clamp-2 text-sm leading-relaxed">
              {card.description || emptyDescriptionText}
            </p>
          </div>

          <div
            className={cn(
              'mt-4 flex w-full flex-col gap-3',
              !stackStatsBelowTags &&
                (isHorizontal
                  ? 'pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-0'
                  : 'sm:flex-row sm:items-center sm:justify-between'),
            )}
          >
            <div
              className={cn(
                'min-w-0 flex-1 shrink overflow-hidden',
                !stackStatsBelowTags &&
                  '[mask-image:linear-gradient(to_right,black_90%,transparent_100%)]',
              )}
            >
              <IdeaTagCloud
                tags={card.tags}
                compact={isMobile}
                tagToShowCount={tagToShowCount}
              />
            </div>

            <div
              className={cn(
                'relative z-10 shrink-0 bg-white',
                stackStatsBelowTags && 'w-full',
              )}
            >
              <DashboardCardStats stats={card.stats} />
            </div>
          </div>
        </Link>

        {hasLinkedItems && (
          <div className="shrink-0 bg-white">
            <LinkedItemsSection
              items={card.linkedItems}
              sectionLabel={linkedSectionLabel}
              getItemDetailHref={getLinkedItemDetailHref}
              expanded={linkedItemsExpanded}
              onToggleExpanded={
                onToggleLinkedItems ? handleToggleLinked : undefined
              }
              linkedItemEmptyImageText={linkedItemEmptyImageText}
            />
          </div>
        )}
      </div>
    </article>
  );
}

function areDashboardCardStandardPropsEqual<
  TCard extends DashboardCardBase = DashboardCardBase,
>(
  prev: DashboardCardStandardProps<TCard>,
  next: DashboardCardStandardProps<TCard>,
): boolean {
  return (
    prev.card === next.card &&
    prev.layout === next.layout &&
    prev.linkedItemsExpanded === next.linkedItemsExpanded &&
    prev.detailHref === next.detailHref &&
    prev.onToggleLinkedItems === next.onToggleLinkedItems &&
    prev.tagToShowCount === next.tagToShowCount &&
    prev.isMobile === next.isMobile &&
    prev.columnCount === next.columnCount &&
    prev.hideLinkedItems === next.hideLinkedItems
  );
}

export const DashboardCardStandard = memo(
  DashboardCardStandardInner,
  areDashboardCardStandardPropsEqual,
) as typeof DashboardCardStandardInner;
