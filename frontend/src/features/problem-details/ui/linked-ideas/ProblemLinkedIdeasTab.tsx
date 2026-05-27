import { LinkExistingIdeaModal } from '@/features/problem-details/modals/LinkExistingIdeaModal';
import { useUnlinkIdeaFromProblemMutation } from '@/features/problem-details/lib/use-problem-idea-link-mutations';
import type { ProblemDetails } from '@/features/problem-details/model/problem-details.types';
import { outlineBtnClass } from '@/features/ideas/lib/styles';
import { Eye, Heart, MessageCircle, MoreVertical, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Link } from '@tanstack/react-router';

type ProblemLinkedIdeasTabProps = {
  problemId: string;
  ideas: ProblemDetails['linkedIdeas'];
  isAuthor?: boolean;
};

const headerActionClass = cn(
  outlineBtnClass,
  'h-9 px-4 text-xs whitespace-nowrap sm:w-auto',
);

const headerActionsLayoutClass =
  'flex w-full flex-row gap-3 md:w-auto md:flex-nowrap';

type LinkedIdeasHeaderProps = {
  onLinkExisting: () => void;
};

function LinkedIdeasHeader({ onLinkExisting }: LinkedIdeasHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h2 className="text-brand-black text-lg font-bold tracking-wide sm:text-xl md:text-2xl">
        Linked ideas
      </h2>
      <div className={headerActionsLayoutClass}>
        <Link
          to={ROUTES.ideasNew}
          className={cn(
            headerActionClass,
            'inline-flex flex-1 items-center justify-center md:flex-initial',
          )}
        >
          Create new idea
        </Link>
        <Button
          type="button"
          variant="outline"
          className={cn(headerActionClass, 'flex-1 md:flex-initial')}
          onClick={onLinkExisting}
        >
          Link existing idea
        </Button>
      </div>
    </div>
  );
}

function LinkedIdeaMicroStats({
  stats,
}: {
  stats: ProblemDetails['linkedIdeas'][number]['stats'];
}) {
  return (
    <div className="text-brand-gray-500 flex flex-wrap items-center gap-4 text-xs">
      <span className="inline-flex items-center gap-1.5">
        <Eye className="size-3.5" aria-hidden />
        <span className="font-medium tabular-nums">{stats.views}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <MessageCircle className="size-3.5" aria-hidden />
        <span className="font-medium tabular-nums">{stats.comments}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Heart className="size-3.5" aria-hidden />
        <span className="font-medium tabular-nums">{stats.likes}</span>
      </span>
    </div>
  );
}

type LinkedIdeaCardProps = {
  idea: ProblemDetails['linkedIdeas'][number];
  canUnlink: boolean;
  isUnlinking: boolean;
  onUnlink: () => void;
};

function LinkedIdeaCard({
  idea,
  canUnlink,
  isUnlinking,
  onUnlink,
}: LinkedIdeaCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:flex-row">
      <div className="relative flex aspect-[16/10] w-full shrink-0 items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 lg:aspect-auto lg:min-h-[200px] lg:w-[240px]">
        {idea.imageUrl ? (
          <img
            src={idea.imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <Sparkles
            className="size-10 text-white/25"
            strokeWidth={1.25}
            aria-hidden
          />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 lg:p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                to={ROUTES.ideaDetail(idea.id)}
                className="text-base font-bold text-gray-900 hover:underline sm:text-lg"
              >
                {idea.title}
              </Link>
              {idea.isPrimary ? (
                <span className="bg-brand-dark-blue/10 text-brand-dark-blue mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                  Primary
                </span>
              ) : null}
            </div>
            {canUnlink ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-brand-gray-500 hover:bg-brand-gray-100 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white transition-colors"
                    aria-label={`Actions for ${idea.title}`}
                  >
                    <MoreVertical className="size-4" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer text-sm font-medium text-orange-600 focus:text-orange-600"
                    disabled={isUnlinking}
                    onSelect={() => onUnlink()}
                  >
                    {isUnlinking ? 'Unlinking…' : 'Unlink idea'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <LinkedIdeaMicroStats stats={idea.stats} />
        </div>
      </div>
    </article>
  );
}

export function ProblemLinkedIdeasTab({
  problemId,
  ideas,
  isAuthor = false,
}: ProblemLinkedIdeasTabProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const unlinkMutation = useUnlinkIdeaFromProblemMutation(problemId);
  const linkedIdeaIds = ideas.map(idea => idea.id);

  const handleUnlink = (ideaId: string) => {
    unlinkMutation.mutate(ideaId);
  };

  return (
    <section className="space-y-6">
      <LinkedIdeasHeader onLinkExisting={() => setLinkModalOpen(true)} />

      <LinkExistingIdeaModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        problemId={problemId}
        linkedIdeaIds={linkedIdeaIds}
      />

      {ideas.length === 0 ? (
        <p className="py-16 text-center text-sm font-medium text-gray-500">
          No ideas linked to this problem yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {ideas.map(idea => (
            <li key={idea.id}>
              <LinkedIdeaCard
                idea={idea}
                canUnlink={isAuthor}
                isUnlinking={
                  unlinkMutation.isPending &&
                  unlinkMutation.variables === idea.id
                }
                onUnlink={() => handleUnlink(idea.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
