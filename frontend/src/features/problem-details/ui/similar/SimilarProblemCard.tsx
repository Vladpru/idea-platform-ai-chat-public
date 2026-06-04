import type { SimilarProblemCard as SimilarProblemCardModel } from '@/features/problem-details/model/problem-details.types';
import { getInitials } from '@/features/idea-details/lib/get-initials';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import { Link } from '@tanstack/react-router';
import { Eye, Heart, MessageCircle } from 'lucide-react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

type SimilarProblemCardProps = {
  card: SimilarProblemCardModel;
  className?: string;
};

const cardSurfaceClass =
  'group flex w-full flex-col overflow-hidden rounded-lg border border-brand-gray-200 bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-dark-blue focus-visible:ring-offset-2 focus-visible:outline-none sm:p-5';

function SimilarProblemCardContent({ card }: SimilarProblemCardProps) {
  return (
    <>
      <div className="space-y-3">
        <h3 className="group-hover:text-primary text-brand-black line-clamp-2 text-base font-bold transition-colors">
          {card.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <Avatar size="sm" className="ring-card ring-2">
              {card.authorAvatarUrl ? (
                <AvatarImage src={card.authorAvatarUrl} alt={card.authorName} />
              ) : null}
              <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-[10px] font-semibold">
                {getInitials(card.authorName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-brand-gray-800 line-clamp-1 text-sm font-medium">
              {card.authorName}
            </span>
          </div>

          <StageChevronBadge stage={card.stage} stageText={false} />
        </div>

        <p className="text-brand-black font-EB-Garamond line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap">
          {card.description || 'No description available for this problem.'}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:items-center">
        <IdeaTagCloud tags={card.tags} tagToShowCount={3} />

        <div className="text-brand-gray-600 flex shrink-0 items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1">
            <Eye className="text-brand-gray-400 size-3.5" aria-hidden />
            <span className="font-semibold tabular-nums">
              {card.stats.views}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle
              className="text-brand-gray-400 size-3.5"
              aria-hidden
            />
            <span className="font-semibold tabular-nums">
              {card.stats.comments}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="text-brand-gray-400 size-3.5" aria-hidden />
            <span className="font-semibold tabular-nums">
              {card.stats.likes}
            </span>
          </span>
        </div>
      </div>
    </>
  );
}

export function SimilarProblemCard({
  card,
  className,
}: SimilarProblemCardProps) {
  return (
    <Link
      to={ROUTES.problemDetail(card.id)}
      className={cn(cardSurfaceClass, className)}
    >
      <SimilarProblemCardContent card={card} />
    </Link>
  );
}
