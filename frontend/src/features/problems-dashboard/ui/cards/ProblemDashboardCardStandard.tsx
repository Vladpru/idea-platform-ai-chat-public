import { getInitials } from '@/features/idea-details/lib/get-initials';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import { Link } from '@tanstack/react-router';
import { type ReactNode, memo, useCallback } from 'react';

import {
  DASHBOARD_CARD_TAG_TO_SHOW_COUNT,
  DashboardCardStats,
  LinkedItemsSection,
  STATS_BELOW_TAGS_COLUMN_THRESHOLD,
} from '@/shared/dashboard';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

import type { ProblemDashboardCard } from '../../model/problems-dashboard.types';

export type ProblemDashboardCardStandardProps = {
  card: ProblemDashboardCard;
  detailHref: string;
  emptyDescriptionText: string;
  emptyImageText: string;
  linkedSectionLabel: string;
  getLinkedItemDetailHref: (id: string) => string;
  linkedItemsExpanded: boolean;
  onToggleLinkedItems?: (cardId: string) => void;
  tagToShowCount?: number;
  isMobile: boolean;
  columnCount?: number;
  linkedItemEmptyImageText?: string;
  actionMenu?: ReactNode;
  likeButton?: ReactNode;
  hideLinkedItems?: boolean;
};

function ProblemDashboardCardStandardInner({
  card,
  detailHref,
  emptyDescriptionText,
  emptyImageText,
  linkedSectionLabel,
  getLinkedItemDetailHref,
  linkedItemsExpanded,
  onToggleLinkedItems,
  tagToShowCount = DASHBOARD_CARD_TAG_TO_SHOW_COUNT,
  isMobile,
  columnCount = 1,
  linkedItemEmptyImageText,
  actionMenu,
  likeButton,
  hideLinkedItems = false,
}: ProblemDashboardCardStandardProps) {
  const hasLinkedItems = !hideLinkedItems && card.linkedItems.length > 0;
  const stackStatsBelowTags = columnCount >= STATS_BELOW_TAGS_COLUMN_THRESHOLD;

  const handleToggleLinked = useCallback(() => {
    onToggleLinkedItems?.(card.id);
  }, [card.id, onToggleLinkedItems]);

  return (
    <article className="group border-brand-gray-200 flex h-full w-full flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md">
      <div className="relative flex h-full min-w-0 flex-col justify-between">
        {actionMenu ? (
          <div className="absolute top-4 right-4 z-20 sm:top-5 sm:right-5">
            {actionMenu}
          </div>
        ) : null}

        <div>
          <Link
            to={detailHref}
            className={cn(
              'focus-visible:ring-brand-dark-blue flex min-w-0 flex-col px-4 pt-4 text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:px-5 sm:pt-5',
              actionMenu && 'pr-10 sm:pr-12',
            )}
          >
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-brand-black group-hover:text-brand-dark-blue line-clamp-2 text-base font-bold tracking-wide transition-colors">
                {card.title}
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
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
                {card.stage?.trim() ? (
                  <StageChevronBadge stage={card.stage} stageText={false} />
                ) : null}
              </div>

              <p className="text-brand-gray-600 line-clamp-3 text-sm leading-relaxed">
                {card.description?.trim() || emptyDescriptionText}
              </p>
            </div>
          </Link>

          <div
            className={cn(
              'flex w-full flex-col gap-3 px-4 pb-4 sm:px-5 sm:pb-5',
              !stackStatsBelowTags &&
                'pt-4 sm:flex-row sm:items-center sm:justify-between',
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
              <DashboardCardStats
                stats={card.stats}
                entityId={card.id}
                entityType="PROBLEM"
                isLiked={card.isLiked}
                likeButton={likeButton}
              />
            </div>
          </div>
        </div>

        {hasLinkedItems ? (
          <div className="shrink-0 bg-white">
            <LinkedItemsSection
              items={card.linkedItems}
              sectionLabel={linkedSectionLabel}
              getItemDetailHref={getLinkedItemDetailHref}
              entityType="PROBLEM"
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

function areProblemDashboardCardStandardPropsEqual(
  prev: ProblemDashboardCardStandardProps,
  next: ProblemDashboardCardStandardProps,
): boolean {
  return (
    prev.card === next.card &&
    prev.card.isLiked === next.card.isLiked &&
    prev.card.stats?.likes === next.card.stats?.likes &&
    prev.linkedItemsExpanded === next.linkedItemsExpanded &&
    prev.detailHref === next.detailHref &&
    prev.onToggleLinkedItems === next.onToggleLinkedItems &&
    prev.tagToShowCount === next.tagToShowCount &&
    prev.isMobile === next.isMobile &&
    prev.columnCount === next.columnCount &&
    prev.hideLinkedItems === next.hideLinkedItems &&
    prev.likeButton === next.likeButton &&
    prev.actionMenu === next.actionMenu
  );
}

export const ProblemDashboardCardStandard = memo(
  ProblemDashboardCardStandardInner,
  areProblemDashboardCardStandardPropsEqual,
);
