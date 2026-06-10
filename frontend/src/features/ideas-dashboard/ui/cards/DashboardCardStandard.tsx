import { getInitials } from '@/features/idea-details/lib/get-initials';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import { Link } from '@tanstack/react-router';
import { type ReactNode, memo, useCallback } from 'react';

import {
  DASHBOARD_CARD_TAG_TO_SHOW_COUNT,
  STATS_BELOW_TAGS_COLUMN_THRESHOLD,
} from '@/shared/dashboard';
import type { DashboardCardBase } from '@/shared/dashboard/model/dashboard.types';
import { DashboardCardStats } from '@/shared/dashboard/ui/cards/DashboardCardStats';
import { LinkedItemsSection } from '@/shared/dashboard/ui/linked-items/LinkedItemsSection';
import { entityDescriptionPreviewClass } from '@/shared/lib/entity-description-classes';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

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
  linkedItemEmptyImageText?: string;
  actionMenu?: ReactNode;
  likeButton?: ReactNode;
  entityType?: 'IDEA' | 'PROBLEM';
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
  linkedItemEmptyImageText,
  actionMenu,
  likeButton,
  entityType = 'IDEA',
  hideLinkedItems = false,
}: DashboardCardStandardProps<TCard>) {
  const isHorizontal = layout === 'horizontal';
  const hasLinkedItems =
    !hideLinkedItems && card.linkedItems && card.linkedItems.length > 0;
  const stackStatsBelowTags = columnCount >= STATS_BELOW_TAGS_COLUMN_THRESHOLD;
  const resolvedIsLiked =
    'isLiked' in card && typeof card.isLiked === 'boolean'
      ? card.isLiked
      : false;

  const handleToggleLinked = useCallback(() => {
    onToggleLinkedItems?.(card.id);
  }, [card.id, onToggleLinkedItems]);

  return (
    <article
      className={cn(
        'group border-brand-gray-200 bg-card flex h-full w-full overflow-hidden rounded-lg border transition-shadow hover:shadow-md',
        isHorizontal
          ? 'min-h-[260px] flex-col sm:flex-row'
          : 'min-h-[400px] flex-col',
      )}
    >
      <Link
        to={detailHref}
        className={cn(
          'bg-brand-gray-100 focus-visible:ring-brand-dark-blue relative block shrink-0 overflow-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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

      <div className="relative flex h-full min-w-0 flex-1 flex-col justify-between overflow-hidden">
        {actionMenu ? (
          <div className="absolute top-4 right-4 z-20 sm:top-5 sm:right-5">
            {actionMenu}
          </div>
        ) : null}

        <div>
          <Link
            to={detailHref}
            className={cn(
              'focus-visible:ring-brand-dark-blue flex min-w-0 flex-1 flex-col text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              isHorizontal
                ? 'px-4 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6'
                : 'px-4 pt-4 sm:px-5 sm:pt-5',
              actionMenu && 'pr-10 sm:pr-12',
            )}
          >
            <div className="space-y-2 sm:space-y-3">
              <h3
                className={cn(
                  'text-brand-black group-hover:text-brand-dark-blue font-bold tracking-wide transition-colors',
                  isHorizontal
                    ? 'line-clamp-2 text-sm sm:line-clamp-1 sm:text-base'
                    : 'line-clamp-2 text-base',
                )}
              >
                {card.title}
              </h3>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar size="sm" className="ring-card dark:ring-none ring-2">
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
                {card.stage?.trim() ? (
                  <StageChevronBadge stage={card.stage} stageText={false} />
                ) : null}
              </div>

              <p
                className={cn(
                  entityDescriptionPreviewClass,
                  'text-brand-gray-600 line-clamp-3',
                )}
              >
                {card.description?.trim() || emptyDescriptionText}
              </p>
            </div>
          </Link>

          <div
            className={cn(
              'flex w-full flex-col gap-3 px-4 pb-4 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6',
              !stackStatsBelowTags &&
                (isHorizontal
                  ? 'pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4'
                  : 'pt-4 sm:flex-row sm:items-center sm:justify-between'),
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
                'bg-card relative z-10 shrink-0',
                stackStatsBelowTags && 'w-full',
              )}
            >
              <DashboardCardStats
                stats={card.stats}
                entityId={card.id}
                entityType={entityType}
                isLiked={resolvedIsLiked}
                likeButton={likeButton}
              />
            </div>
          </div>
        </div>

        {hasLinkedItems ? (
          <div className="bg-card shrink-0">
            <LinkedItemsSection
              items={card.linkedItems}
              sectionLabel={linkedSectionLabel}
              getItemDetailHref={getLinkedItemDetailHref}
              entityType="IDEA"
              expanded={linkedItemsExpanded}
              onToggleExpanded={
                onToggleLinkedItems ? handleToggleLinked : undefined
              }
              columnCount={columnCount}
              linkedItemEmptyImageText={
                linkedItemEmptyImageText ?? emptyImageText
              }
            />
          </div>
        ) : null}
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
  const prevIsLiked = 'isLiked' in prev.card ? prev.card.isLiked : undefined;
  const nextIsLiked = 'isLiked' in next.card ? next.card.isLiked : undefined;
  const prevLikes = prev.card.stats?.likes;
  const nextLikes = next.card.stats?.likes;

  return (
    prev.card === next.card &&
    prevIsLiked === nextIsLiked &&
    prevLikes === nextLikes &&
    prev.layout === next.layout &&
    prev.linkedItemsExpanded === next.linkedItemsExpanded &&
    prev.detailHref === next.detailHref &&
    prev.onToggleLinkedItems === next.onToggleLinkedItems &&
    prev.tagToShowCount === next.tagToShowCount &&
    prev.isMobile === next.isMobile &&
    prev.columnCount === next.columnCount &&
    prev.hideLinkedItems === next.hideLinkedItems &&
    prev.entityType === next.entityType &&
    prev.likeButton === next.likeButton &&
    prev.actionMenu === next.actionMenu
  );
}

export const DashboardCardStandard = memo(
  DashboardCardStandardInner,
  areDashboardCardStandardPropsEqual,
) as typeof DashboardCardStandardInner;
