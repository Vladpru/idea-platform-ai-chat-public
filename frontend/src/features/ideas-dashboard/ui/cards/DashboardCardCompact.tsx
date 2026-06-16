import { getInitials } from '@/features/idea-details/lib/get-initials';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import { Link } from '@tanstack/react-router';
import { type ReactNode, memo } from 'react';

import type { DashboardCardBase } from '@/shared/dashboard/model/dashboard.types';
import { DashboardCardStats } from '@/shared/dashboard/ui/cards/DashboardCardStats';
import { LinkedItemsSection } from '@/shared/dashboard/ui/linked-items/LinkedItemsSection';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

export type DashboardCardCompactProps<
  TCard extends DashboardCardBase = DashboardCardBase,
> = {
  card: TCard;
  detailHref: string;
  emptyImageText: string;
  linkedSectionLabel: string;
  getLinkedItemDetailHref: (id: string) => string;
  forceShowLinkedItems?: boolean;
  columnCount?: number;
  likeButton?: ReactNode;
};

const cardLinkClassName =
  'focus-visible:ring-brand-dark-blue rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none';

function DashboardCardCompactInner<
  TCard extends DashboardCardBase = DashboardCardBase,
>({
  card,
  detailHref,
  emptyImageText,
  linkedSectionLabel,
  getLinkedItemDetailHref,
  forceShowLinkedItems = false,
  columnCount = 1,
  likeButton,
}: DashboardCardCompactProps<TCard>) {
  const linkedItems = card.linkedItems;
  const isNarrow = columnCount > 5;
  const showHover = forceShowLinkedItems || linkedItems.length > 0;
  const resolvedIsLiked =
    'isLiked' in card && typeof card.isLiked === 'boolean'
      ? card.isLiked
      : false;

  const statsProps = {
    stats: card.stats,
    entityId: card.id,
    entityType: 'IDEA' as const,
    isLiked: resolvedIsLiked,
    likeButton,
  };

  const titleClassName = cn(
    'text-brand-dark-blue leading-snug font-bold',
    isNarrow ? 'line-clamp-2 text-sm' : 'line-clamp-2 text-lg',
  );

  const authorClassName = cn(
    'text-brand-gray-800 truncate font-medium',
    isNarrow ? 'text-[11px]' : 'text-sm',
  );

  const avatarClassName = cn(isNarrow ? 'size-6' : 'size-8');

  const statsClassName = cn(
    'text-slate-600',
    isNarrow ? 'text-[11px]' : 'text-[15px]',
  );

  const statsIconClassName = isNarrow ? 'size-3' : 'size-3.5';

  const cardPadding = isNarrow ? 'p-3' : 'p-4';

  const cardMinHeight = isNarrow ? 'min-h-[300px]' : '';

  const authorRow = (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className={avatarClassName}>
        <AvatarImage src={card.authorAvatarUrl ?? undefined} />
        <AvatarFallback>{getInitials(card.authorName)}</AvatarFallback>
      </Avatar>
      <span className={authorClassName}>{card.authorName}</span>
    </div>
  );

  const stageBadge = card.stage?.trim() ? (
    <StageChevronBadge
      stage={card.stage}
      stageText={false}
      compact={isNarrow}
    />
  ) : null;

  return (
    <article
      className={cn(
        'group border-brand-gray-200 bg-card relative flex h-full flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md',
        cardMinHeight,
      )}
    >
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
          'pointer-events-none relative z-[2] flex h-full flex-col',
          showHover && 'transition-opacity duration-300 group-hover:opacity-0',
        )}
      >
        <div className="bg-brand-gray-100 relative aspect-16/10 w-full shrink-0 overflow-hidden">
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
        </div>

        <div className={cn('flex flex-1 flex-col', cardPadding)}>
          <h3 className={titleClassName}>{card.title}</h3>

          <div className="mt-3">{authorRow}</div>

          <DashboardCardStats
            {...statsProps}
            className={cn(
              'pointer-events-auto relative z-[3] mt-auto pt-3',
              statsClassName,
            )}
            iconClassName={statsIconClassName}
          />
        </div>
      </div>

      {showHover ? (
        <div
          className={cn(
            'bg-card absolute inset-0 z-[3] flex flex-col overflow-hidden',
            'pointer-events-none opacity-0 transition-opacity duration-300',
            'group-hover:pointer-events-auto group-hover:opacity-100',
            cardPadding,
          )}
        >
          <Link
            to={detailHref}
            className={cn(
              cardLinkClassName,
              'pointer-events-auto flex min-w-0 shrink-0 flex-col gap-3',
            )}
          >
            <h3 className={titleClassName}>{card.title}</h3>

            <div
              className={cn(
                'flex min-w-0',
                isNarrow
                  ? 'flex-col items-start gap-2'
                  : 'flex-row items-center gap-2',
              )}
            >
              {authorRow}
              {stageBadge}
            </div>

            <IdeaTagCloud tags={card.tags} compact />
          </Link>

          <div className="pointer-events-auto relative z-[4] shrink-0">
            <DashboardCardStats
              {...statsProps}
              className={statsClassName}
              iconClassName={statsIconClassName}
            />
          </div>

          {linkedItems.length > 0 ? (
            <div
              className={cn(
                'border-brand-gray-200 pointer-events-auto relative z-[4] mt-auto flex min-h-0 min-w-0 flex-col border-t',
                isNarrow ? 'pt-1' : 'pt-2',
              )}
            >
              <LinkedItemsSection
                items={linkedItems}
                sectionLabel={linkedSectionLabel}
                getItemDetailHref={getLinkedItemDetailHref}
                entityType="IDEA"
                expanded
                showToggle={false}
                columnCount={columnCount}
                className="min-h-0 px-0 pt-2 pb-0"
                linkedItemEmptyImageText={emptyImageText}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function areDashboardCardCompactPropsEqual<
  TCard extends DashboardCardBase = DashboardCardBase,
>(
  prev: DashboardCardCompactProps<TCard>,
  next: DashboardCardCompactProps<TCard>,
): boolean {
  const prevIsLiked = 'isLiked' in prev.card ? prev.card.isLiked : undefined;
  const nextIsLiked = 'isLiked' in next.card ? next.card.isLiked : undefined;
  const prevLikes = prev.card.stats?.likes;
  const nextLikes = next.card.stats?.likes;

  return (
    prev.card === next.card &&
    prevIsLiked === nextIsLiked &&
    prevLikes === nextLikes &&
    prev.forceShowLinkedItems === next.forceShowLinkedItems &&
    prev.columnCount === next.columnCount &&
    prev.detailHref === next.detailHref &&
    prev.likeButton === next.likeButton &&
    prev.getLinkedItemDetailHref === next.getLinkedItemDetailHref &&
    prev.linkedSectionLabel === next.linkedSectionLabel &&
    prev.emptyImageText === next.emptyImageText
  );
}

export const DashboardCardCompact = memo(
  DashboardCardCompactInner,
  areDashboardCardCompactPropsEqual,
) as typeof DashboardCardCompactInner;
