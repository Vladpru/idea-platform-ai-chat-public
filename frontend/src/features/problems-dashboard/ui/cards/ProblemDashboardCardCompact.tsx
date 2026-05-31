import { getInitials } from '@/features/idea-details/lib/get-initials';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import {
  DashboardCardStats,
  LinkedItemsSection,
} from '@/shared/dashboard';
import { Link } from '@tanstack/react-router';
import { type ReactNode, memo } from 'react';

import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

import type { ProblemDashboardCard } from '../../model/problems-dashboard.types';

export type ProblemDashboardCardCompactProps = {
  card: ProblemDashboardCard;
  detailHref: string;
  emptyImageText: string;
  linkedSectionLabel: string;
  getLinkedItemDetailHref: (id: string) => string;
  columnCount?: number;
  likeButton?: ReactNode;
};

function ProblemDashboardCardCompactInner({
  card,
  detailHref,
  emptyImageText,
  linkedSectionLabel,
  getLinkedItemDetailHref,
  columnCount = 1,
  likeButton,
}: ProblemDashboardCardCompactProps) {
  const linkedItems = card.linkedItems;
  const showHover = linkedItems.length > 0;

  const statsProps = {
    stats: card.stats,
    entityId: card.id,
    entityType: 'PROBLEM' as const,
    isLiked: card.isLiked,
    likeButton,
  };

  return (
    <article className="group border-brand-gray-200 relative flex h-full min-h-[200px] cursor-pointer flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
      <div
        className={cn(
          'flex h-full min-h-0 flex-col transition-opacity duration-300',
          showHover && 'group-hover:opacity-0',
          'p-3',
        )}
      >
        <Link to={detailHref} className="shrink-0">
          <h3 className="text-brand-black line-clamp-2 text-base leading-snug font-bold tracking-wide">
            {card.title}
          </h3>
        </Link>

        <div className="mt-3 flex min-w-0 items-center gap-2">
          <Avatar size="sm" className="ring-2 ring-white">
            {card.authorAvatarUrl ? (
              <AvatarImage src={card.authorAvatarUrl} alt={card.authorName} />
            ) : null}
            <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-[10px] font-semibold">
              {getInitials(card.authorName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-brand-gray-600 line-clamp-1 text-xs font-medium">
            {card.authorName}
          </span>
        </div>

        {card.stage?.trim() && (
          <div className="mt-2 ml-3 shrink-0 self-start">
            <StageChevronBadge
              stage={card.stage}
              stageText={false}
              className={'h-[18px]'}
            />
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <IdeaTagCloud tags={card.tags} compact />
          <DashboardCardStats
            {...statsProps}
            className="text-[11px] text-slate-600"
            iconClassName="size-3"
          />
        </div>
      </div>

      {showHover && (
        <div
          className={cn(
            'absolute inset-0 z-10 flex flex-col justify-between overflow-hidden bg-white',
            'pointer-events-none opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100',
            'p-3',
          )}
        >
          <div className="">
            <Link to={detailHref} className="shrink-0">
              <h3 className="text-brand-black line-clamp-2 text-base leading-snug font-bold tracking-wide">
                {card.title}
              </h3>
            </Link>

            <div className="mt-3 flex min-w-0 items-center gap-2">
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

            {card.stage?.trim() && (
              <div className="mt-2 ml-3 shrink-0 self-start">
                <StageChevronBadge
                  stage={card.stage}
                  stageText={false}
                  className={'h-[18px]'}
                />
              </div>
            )}
          </div>

          <div className="mt-3 min-h-0 min-w-0 overflow-hidden">
            <LinkedItemsSection
              items={linkedItems}
              sectionLabel={linkedSectionLabel}
              getItemDetailHref={getLinkedItemDetailHref}
              entityType="PROBLEM"
              expanded
              showToggle={false}
              columnCount={columnCount}
              className="min-h-0 px-0 pt-0 pb-0"
              linkedItemEmptyImageText={emptyImageText}
            />
          </div>
        </div>
      )}
    </article>
  );
}

function areProblemDashboardCardCompactPropsEqual(
  prev: ProblemDashboardCardCompactProps,
  next: ProblemDashboardCardCompactProps,
): boolean {
  return (
    prev.card === next.card &&
    prev.card.isLiked === next.card.isLiked &&
    prev.card.stats?.likes === next.card.stats?.likes &&
    prev.columnCount === next.columnCount &&
    prev.detailHref === next.detailHref &&
    prev.likeButton === next.likeButton &&
    prev.getLinkedItemDetailHref === next.getLinkedItemDetailHref &&
    prev.linkedSectionLabel === next.linkedSectionLabel &&
    prev.emptyImageText === next.emptyImageText
  );
}

export const ProblemDashboardCardCompact = memo(
  ProblemDashboardCardCompactInner,
  areProblemDashboardCardCompactPropsEqual,
);
