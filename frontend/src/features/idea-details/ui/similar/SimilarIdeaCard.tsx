import type { SimilarIdeaCard as SimilarIdeaCardModel } from '@/features/idea-details/model/idea-details.types';
import { Link } from '@tanstack/react-router';
import { Eye, Heart, MessageCircle } from 'lucide-react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';
import { IdeaTagCloud } from '../IdeaTagCloud';

import { getInitials } from '@/features/idea-details/lib/get-initials';

type SimilarIdeaCardProps = {
  card: SimilarIdeaCardModel;
  className?: string;
};

const cardSurfaceClass =
  'group flex w-full flex-col overflow-hidden rounded-lg border border-brand-gray-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-dark-blue focus-visible:ring-offset-2 focus-visible:outline-none lg:flex-row';

function SimilarIdeaCardContent({ card }: SimilarIdeaCardProps) {
  return (
    <>
      <div className="bg-brand-gray-100 relative aspect-[16/10] w-full shrink-0 overflow-hidden lg:h-[226px] lg:w-[400px]">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
        ) : (
          <div className="text-brand-gray-400 flex size-full items-center justify-center text-xs font-semibold uppercase">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 lg:p-6">
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-brand-black group-hover:text-brand-dark-blue line-clamp-2 text-sm font-bold tracking-wide transition-colors sm:line-clamp-1 sm:text-base">
            {card.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
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
                {card.authorName || 'Anonymous'}
              </span>
            </div>

            <StageChevronBadge stage={card.stage} stageText={false} />
          </div>

          <p className="text-brand-black font-EB-Garamond line-clamp-3 text-sm leading-relaxed whitespace-pre-wrap sm:text-base">
            {card.description || 'No description available for this idea.'}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-50 pt-3 sm:flex-row sm:items-end sm:justify-between sm:border-t-0 sm:pt-0 md:items-center">
          <IdeaTagCloud tags={card.tags} tagToShowCount={3} />

          <div className="text-brand-gray-600 flex shrink-0 items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1">
              <Eye className="text-brand-gray-400 size-3.5" />
              <span className="font-semibold tabular-nums">
                {card.stats.views}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="text-brand-gray-400 size-3.5" />
              <span className="font-semibold tabular-nums">
                {card.stats.comments}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="text-brand-gray-400 size-3.5" />
              <span className="font-semibold tabular-nums">
                {card.stats.likes}
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export function SimilarIdeaCard({ card, className }: SimilarIdeaCardProps) {
  if (card.externalUrl) {
    return (
      <a
        href={card.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(cardSurfaceClass, className)}
      >
        <SimilarIdeaCardContent card={card} />
      </a>
    );
  }

  return (
    <Link
      to={ROUTES.ideaDetail(card.id)}
      className={cn(cardSurfaceClass, className)}
    >
      <SimilarIdeaCardContent card={card} />
    </Link>
  );
}
