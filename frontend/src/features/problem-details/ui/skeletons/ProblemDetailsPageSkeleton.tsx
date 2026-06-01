import { IdeaDescriptionSkeleton } from '@/features/idea-details/ui/skeletons/IdeaDescriptionSkeleton';
import { IdeaHeaderSkeleton } from '@/features/idea-details/ui/skeletons/IdeaHeaderSkeleton';
import { SimilarProblemsListSkeleton } from './SimilarProblemsListSkeleton';
import { Skeleton } from '@/shared/ui/skeleton';

const TAB_KEYS = [
  'description',
  'attachments',
  'discussion',
  'linked-ideas',
] as const;

export function ProblemDetailsPageSkeleton() {
  return (
    <main
      className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 py-6 md:px-8 lg:px-12"
      aria-busy
      aria-label="Loading problem details"
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <Skeleton className="h-4 w-16" />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
          <IdeaDescriptionSkeleton />
        </section>

        <section className="space-y-4 pt-2">
          <Skeleton className="h-7 w-48 sm:w-56" />
          <SimilarProblemsListSkeleton />
        </section>
      </div>
    </main>
  );
}
