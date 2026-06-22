import { Link } from '@tanstack/react-router';
import { Eye, MessageCircle } from 'lucide-react';

import { getInitials } from '@/features/idea-details/lib/get-initials';
import { entityDescriptionPreviewClass } from '@/shared/lib/entity-description-classes';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { LikeButton } from '@/shared/ui/LikeButton';
import { MarkdownRenderer } from '@/shared/ui/rich-text-editor';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

import { IdeaTagCloud } from '../IdeaTagCloud';

export type SimilarEntityCardData = {
  id: string;
  title: string;
  description: string | null;
  imageUrl?: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  stage: string;
  tags: string[];
  stats: {
    views: number;
    comments: number;
    likes: number;
  };
  isLiked?: boolean;
  externalUrl?: string;
};

type SimilarEntityCardProps = {
  card: SimilarEntityCardData;
  entityType: 'IDEA' | 'PROBLEM';
  detailRoute: (id: string) => string;
  showImage?: boolean;
  className?: string;
};

type SimilarEntityCardContentProps = {
  card: SimilarEntityCardData;
  entityType: 'IDEA' | 'PROBLEM';
  showImage: boolean;
};

const cardSurfaceClass =
  'group flex w-full flex-col overflow-hidden rounded-lg border border-brand-gray-200 bg-card text-left shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-dark-blue focus-visible:ring-offset-2 focus-visible:outline-none lg:flex-row';

function SimilarEntityCardContent({
  card,
  entityType,
  showImage,
}: SimilarEntityCardContentProps) {
  const entityNoun = entityType === 'IDEA' ? 'idea' : 'problem';

  return (
    <>
      {showImage ? (
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
      ) : null}

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 lg:p-6">
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-brand-black group-hover:text-brand-dark-blue line-clamp-2 text-sm font-bold tracking-wide transition-colors sm:line-clamp-1 sm:text-base">
            {card.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
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
                {card.authorName || 'Anonymous'}
              </span>
            </div>

            <StageChevronBadge stage={card.stage} stageText={false} />
          </div>

          {card.description ? (
            <MarkdownRenderer
              content={card.description}
              className={cn(entityDescriptionPreviewClass, 'line-clamp-3')}
            />
          ) : (
            <p className={cn(entityDescriptionPreviewClass, 'line-clamp-3')}>
              No description available for this {entityNoun}.
            </p>
          )}
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
            <LikeButton
              entityId={card.id}
              entityType={entityType}
              isLiked={card.isLiked ?? false}
              likeCount={card.stats?.likes ?? 0}
              className="cursor-pointer px-0 py-0 text-xs font-semibold hover:bg-transparent"
              iconClassName="text-brand-gray-400 size-3.5"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function SimilarEntityCard({
  card,
  entityType,
  detailRoute,
  showImage = true,
  className,
}: SimilarEntityCardProps) {
  if (card.externalUrl) {
    return (
      <a
        href={card.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(cardSurfaceClass, className)}
      >
        <SimilarEntityCardContent
          card={card}
          entityType={entityType}
          showImage={showImage}
        />
      </a>
    );
  }

  return (
    <Link to={detailRoute(card.id)} className={cn(cardSurfaceClass, className)}>
      <SimilarEntityCardContent
        card={card}
        entityType={entityType}
        showImage={showImage}
      />
    </Link>
  );
}
