import type { IdeaDetails } from '@/features/idea-details/model/idea-details.types';
import { LinkExistingProblemModal } from '@/features/idea-details/modals/LinkExistingProblemModal';
import { outlineBtnClass } from '@/features/ideas/lib/styles';
import { useState } from 'react';
import {
  Eye,
  Heart,
  MessageCircle,
  MoreVertical,
  Sparkles,
} from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { StageChevronBadge } from '@/shared/ui/stage-chevron-badge';

import { getInitials } from '@/features/idea-details/lib/get-initials';

type IdeaLinkedProblemsTabProps = {
  ideaId: string;
  problems: IdeaDetails['linkedProblems'];
};

const VISIBLE_TAG_COUNT = 2;

const headerActionClass = cn(
  outlineBtnClass,
  'h-9 px-4 text-xs whitespace-nowrap sm:w-auto',
);

const headerActionsLayoutClass =
  'flex w-full flex-row gap-3 md:w-auto md:flex-nowrap';

type LinkedProblemsHeaderProps = {
  ideaId: string;
  onLinkExisting: () => void;
};

function LinkedProblemsHeader({
  ideaId,
  onLinkExisting,
}: LinkedProblemsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h2 className="text-brand-black text-lg font-bold tracking-wide sm:text-xl md:text-2xl">
        Linked problems
      </h2>
      <div className={headerActionsLayoutClass}>
        <a
          href={`/problems/new?fromIdeaId=${encodeURIComponent(ideaId)}`}
          className={cn(
            headerActionClass,
            'inline-flex flex-1 items-center justify-center md:flex-initial',
          )}
        >
          Create new problem
        </a>
        <Button
          type="button"
          variant="outline"
          className={cn(headerActionClass, 'flex-1 md:flex-initial')}
          onClick={onLinkExisting}
        >
          Link existing problem
        </Button>
      </div>
    </div>
  );
}

type LinkedProblemCardProps = {
  problem: IdeaDetails['linkedProblems'][number];
};

function LinkedProblemMicroStats({
  stats,
}: {
  stats: IdeaDetails['linkedProblems'][number]['stats'];
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

function LinkedProblemTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <span className="block min-h-[22px]" aria-hidden />;
  }

  const visible = tags.slice(0, VISIBLE_TAG_COUNT);
  const overflow = tags.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map(tag => (
        <span
          key={tag}
          className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium tracking-wide text-gray-600 uppercase"
        >
          {tag}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

function LinkedProblemCard({ problem }: LinkedProblemCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:flex-row">
      <div className="relative flex aspect-[16/10] w-full shrink-0 items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 lg:aspect-auto lg:min-h-[200px] lg:w-[240px]">
        {problem.imageUrl ? (
          <img
            src={problem.imageUrl}
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
              <a
                href={`/problems/${problem.id}`}
                className="text-base font-bold text-gray-900 hover:underline sm:text-lg"
              >
                {problem.title}
              </a>
              {problem.isPrimary ? (
                <span className="bg-brand-dark-blue/10 text-brand-dark-blue mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                  Primary
                </span>
              ) : null}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="text-brand-gray-500 hover:bg-brand-gray-100 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white transition-colors"
                  aria-label={`Actions for ${problem.title}`}
                >
                  <MoreVertical className="size-4" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer text-sm font-medium text-orange-600 focus:text-orange-600"
                  onSelect={event => event.preventDefault()}
                >
                  Unlink problem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar size="sm" className="ring-2 ring-white">
                {problem.authorAvatarUrl ? (
                  <AvatarImage
                    src={problem.authorAvatarUrl}
                    alt={problem.authorName}
                  />
                ) : null}
                <AvatarFallback className="bg-brand-gray-200 text-brand-gray-800 text-[10px] font-semibold">
                  {getInitials(problem.authorName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-brand-gray-800 text-sm font-medium">
                {problem.authorName}
              </span>
            </div>
            <StageChevronBadge stage={problem.status} />
          </div>

          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-gray-500 sm:text-sm">
            {problem.description}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:items-center">
          <LinkedProblemTags tags={problem.tags} />
          <LinkedProblemMicroStats stats={problem.stats} />
        </div>
      </div>
    </article>
  );
}

export function IdeaLinkedProblemsTab({
  ideaId,
  problems,
}: IdeaLinkedProblemsTabProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const linkedProblemIds = problems.map(problem => problem.id);

  return (
    <section className="space-y-6">
      <LinkedProblemsHeader
        ideaId={ideaId}
        onLinkExisting={() => setLinkModalOpen(true)}
      />

      <LinkExistingProblemModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        ideaId={ideaId}
        linkedProblemIds={linkedProblemIds}
      />

      {problems.length === 0 ? (
        <p className="py-16 text-center text-sm font-medium text-gray-500">
          No problems linked to this idea yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {problems.map(problem => (
            <li key={problem.id}>
              <LinkedProblemCard problem={problem} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
