import { getInitials } from '@/features/idea-details/lib/get-initials';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import { Link } from '@tanstack/react-router';
import { ArrowRight, ChevronUp } from 'lucide-react';
import { memo } from 'react';

import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

import type { DashboardCardBase } from '../model/dashboard.types';

import { DashboardCardStats } from './DashboardCardStats';

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
};

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
}: DashboardCardCompactProps<TCard>) {
  const linkedItems = card.linkedItems;
  const showLinkedOnHover = forceShowLinkedItems || linkedItems.length > 0;
  const isNarrow = columnCount > 5;
  const firstLinkedItem = linkedItems[0];

  return (
    <article className="group border-brand-gray-200 relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md">
      <Link
        to={detailHref}
        className={cn(
          'flex h-full flex-col transition-opacity duration-300',
          showLinkedOnHover && 'group-hover:opacity-0',
        )}
      >
        <div className="bg-brand-gray-100 aspect-[16/10] w-full shrink-0 overflow-hidden">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="text-brand-gray-400 flex size-full items-center justify-center text-[10px] uppercase">
              {emptyImageText}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3
            className={cn(
              'text-brand-dark-blue leading-snug font-bold',
              isNarrow ? 'line-clamp-2 text-sm' : 'line-clamp-2 text-lg',
            )}
          >
            {card.title}
          </h3>

          <div className="mt-3 flex items-center gap-2">
            <Avatar className={cn(isNarrow ? 'size-6' : 'size-8')}>
              <AvatarImage src={card.authorAvatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(card.authorName)}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'text-brand-gray-800 truncate font-medium',
                isNarrow ? 'text-[11px]' : 'text-sm',
              )}
            >
              {card.authorName}
            </span>
          </div>

          <DashboardCardStats
            stats={card.stats}
            className={cn(
              'mt-auto text-slate-600',
              isNarrow ? 'pt-3 text-[11px]' : 'pt-6 text-[15px]',
            )}
          />
        </div>
      </Link>

      {showLinkedOnHover ? (
        <div
          className={cn(
            'absolute inset-0 z-10 flex flex-col overflow-hidden bg-white',
            'pointer-events-none transition-opacity duration-300 group-hover:pointer-events-auto',
            'opacity-0 group-hover:opacity-100',
            isNarrow ? 'p-3' : 'p-4',
          )}
        >
          <Link to={detailHref} className="shrink-0">
            <h3
              className={cn(
                'text-brand-dark-blue leading-snug font-bold',
                isNarrow ? 'line-clamp-2 text-sm' : 'line-clamp-2 text-lg',
              )}
            >
              {card.title}
            </h3>
          </Link>

          <div
            className={cn(
              'flex min-w-0 shrink-0',
              isNarrow
                ? 'mt-3 flex-col items-start gap-2'
                : 'mt-3 flex-row items-center gap-2',
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className={cn(isNarrow ? 'size-6' : 'size-8')}>
                <AvatarImage src={card.authorAvatarUrl ?? undefined} />
                <AvatarFallback>{getInitials(card.authorName)}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'text-brand-gray-800 truncate font-medium',
                  isNarrow ? 'text-[11px]' : 'text-sm',
                )}
              >
                {card.authorName}
              </span>
            </div>
            <div className={cn(isNarrow ? 'mx-2' : '')}>
              <StageChevronBadge
                stage={card.stage}
                stageText={false}
                compact={isNarrow}
              />
            </div>
          </div>

          <div
            className={cn(
              'flex min-w-0 shrink-0 flex-col',
              isNarrow ? 'mt-3 gap-2' : 'mt-4 gap-3',
            )}
          >
            <IdeaTagCloud tags={card.tags} compact={true} />
            <DashboardCardStats
              stats={card.stats}
              className={cn(
                'text-slate-600',
                isNarrow ? 'text-[11px]' : 'text-[15px]',
              )}
            />
          </div>

          {firstLinkedItem ? (
            <div
              className={cn(
                'border-brand-gray-200 mt-auto flex min-w-0 shrink-0 flex-col border-t',
                isNarrow ? 'pt-2' : 'pt-3',
              )}
            >
              <div
                className={cn(
                  'text-dark-blue-900 flex cursor-pointer items-center font-bold tracking-wide uppercase',
                  isNarrow ? 'gap-1.5 text-[10px]' : 'gap-2.5 text-sm',
                )}
              >
                <ChevronUp
                  className={cn(
                    'text-brand-dark-blue shrink-0 cursor-pointer',
                    isNarrow ? 'size-3' : 'size-5',
                  )}
                />
                <span className="truncate">{linkedSectionLabel}</span>
              </div>

              <Link
                to={getLinkedItemDetailHref(firstLinkedItem.id)}
                className={cn(
                  'group/item mt-2 flex min-w-0 items-center gap-2 overflow-hidden',
                  'border-brand-gray-200 rounded-lg border',
                  'hover:bg-brand-gray-100 bg-white transition-colors',
                  isNarrow ? 'p-1.5' : 'p-3',
                )}
              >
                <h4
                  className={cn(
                    'text-dark-blue-800 min-w-0 flex-1 leading-snug font-semibold',
                    isNarrow
                      ? 'truncate text-[10px]'
                      : 'line-clamp-2 text-[15px]',
                  )}
                >
                  {firstLinkedItem.title}
                </h4>
                <span
                  className={cn(
                    'border-brand-gray-200 text-brand-dark-blue flex shrink-0 items-center justify-center rounded-lg border transition-colors',
                    'group-hover/item:border-brand-dark-blue group-hover/item:bg-brand-dark-blue group-hover/item:text-white',
                    isNarrow ? 'size-6' : 'size-10',
                  )}
                >
                  <ArrowRight className={cn(isNarrow ? 'size-3' : 'size-5')} />
                </span>
              </Link>
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
  return (
    prev.card === next.card &&
    prev.forceShowLinkedItems === next.forceShowLinkedItems &&
    prev.columnCount === next.columnCount &&
    prev.detailHref === next.detailHref
  );
}

export const DashboardCardCompact = memo(
  DashboardCardCompactInner,
  areDashboardCardCompactPropsEqual,
) as typeof DashboardCardCompactInner;
