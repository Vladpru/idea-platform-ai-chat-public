import { getInitials } from '@/features/idea-details/lib/get-initials';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import { Link } from '@tanstack/react-router';
import { type ReactNode, memo } from 'react';

import { DashboardCardStats, LinkedItemsSection } from '@/shared/dashboard';
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

const cardLinkClassName =
  'focus-visible:ring-brand-dark-blue rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none';

const titleClassName =
  'text-brand-black line-clamp-2 text-base leading-snug font-bold tracking-wide';

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

  const authorRow = (
    <div className="flex min-w-0 items-center gap-2">
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
  );

  const stageBadge = card.stage?.trim() ? (
    <div className="ml-3 shrink-0 self-start">
      <StageChevronBadge
        stage={card.stage}
        stageText={false}
        className="h-[18px]"
      />
    </div>
  ) : null;

  return (
    <article className="group border-brand-gray-200 bg-card relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md">
      <Link
        to={detailHref}
        aria-label={card.title}
        className={cn(
          cardLinkClassName,
          'absolute inset-0 z-[1]',
          showHover &&
            'transition-opacity duration-300 group-hover:pointer-events-none group-hover:opacity-0',
        )}
      />

      <div
        className={cn(
          'pointer-events-none relative z-[2] flex h-full min-h-0 flex-col p-3',
          showHover && 'transition-opacity duration-300 group-hover:opacity-0',
        )}
      >
        <h3 className={titleClassName}>{card.title}</h3>

        <div className="mt-3">{authorRow}</div>

        {stageBadge ? <div className="mt-2">{stageBadge}</div> : null}

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <IdeaTagCloud tags={card.tags} compact />
          <DashboardCardStats
            {...statsProps}
            className="pointer-events-auto text-[11px] text-slate-600"
            iconClassName="size-3"
          />
        </div>
      </div>

      {showHover ? (
        <div
          className={cn(
            'bg-card absolute inset-0 z-[3] flex flex-col justify-between overflow-hidden p-3',
            'pointer-events-none opacity-0 transition-opacity duration-300',
            'group-hover:pointer-events-auto group-hover:opacity-100',
          )}
        >
          <Link
            to={detailHref}
            className={cn(
              cardLinkClassName,
              'pointer-events-auto flex min-w-0 shrink-0 flex-col',
            )}
          >
            <h3 className={titleClassName}>{card.title}</h3>

            <div className="mt-3">{authorRow}</div>

            {stageBadge ? <div className="mt-2">{stageBadge}</div> : null}
          </Link>

          <div className="pointer-events-auto relative z-[4] mt-3 min-h-0 min-w-0 overflow-hidden">
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
      ) : null}
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
