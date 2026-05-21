import { Skeleton } from '@/shared/ui/skeleton';

import { IdeaDescriptionSkeleton } from './IdeaDescriptionSkeleton';
import { IdeaFeaturedImageSkeleton } from './IdeaFeaturedImageSkeleton';
import { IdeaHeaderSkeleton } from './IdeaHeaderSkeleton';
import { SimilarIdeasRowSkeleton } from './SimilarIdeasRowSkeleton';

const TAB_KEYS = [
  'description',
  'stats',
  'comments',
  'found-on-web',
] as const;

export function IdeaDetailsPageSkeleton() {
  return (
    <main
      className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 py-6 md:px-8 lg:px-12"
      aria-busy
      aria-label="Loading idea details"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <IdeaHeaderSkeleton />

        <nav
          className="scrollbar-none flex gap-4 overflow-x-auto border-b border-brand-gray-200 pb-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-6"
          aria-hidden
        >
          {TAB_KEYS.map(key => (
            <Skeleton key={key} className="h-9 w-20 shrink-0 sm:w-28" />
          ))}
        </nav>

        <section className="space-y-6">
          <IdeaFeaturedImageSkeleton />
          <IdeaDescriptionSkeleton />
        </section>

        <section className="space-y-4 pt-2">
          <Skeleton className="h-7 w-40 sm:w-48" />
          <SimilarIdeasRowSkeleton />
        </section>
      </div>
    </main>
  );
}
