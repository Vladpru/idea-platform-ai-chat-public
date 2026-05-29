import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { IdeaStatsFooter } from '@/features/idea-details/ui/IdeaStatsFooter';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import {
  useProblemDetailsQuery,
  useSimilarProblemsQuery,
} from '@/features/problem-details/lib/use-problem-details-queries';
import { DEFAULT_PROBLEMS_DASHBOARD_SEARCH } from '@/features/problems-dashboard/lib/constants';
import type { ProblemTabId } from '@/features/problem-details/model/problem-details.types';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { type MouseEvent, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { AnimatedPanel, AnimatedPanelSwitch } from '@/shared/ui/motion';

import { ProblemAttachmentsTab } from './attachments/ProblemAttachmentsTab';
import { ProblemHeader } from './ProblemHeader';
import { ProblemInfoCards } from './ProblemInfoCards';
import { ProblemLinkedIdeasTab } from './linked-ideas/ProblemLinkedIdeasTab';
import { ProblemTabs } from './ProblemTabs';
import { SimilarProblemsWidget } from './similar/SimilarProblemsWidget';
import { ProblemDetailsPageSkeleton } from './skeletons/ProblemDetailsPageSkeleton';

type ProblemDetailsViewProps = {
  problemId: string;
};

type ProblemDetailsErrorStateProps = {
  message: string;
};

function ProblemDetailsErrorState({ message }: ProblemDetailsErrorStateProps) {
  return (
    <main className="bg-brand-neutral flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="border-brand-gray-200 max-w-md rounded-lg border bg-white px-8 py-10 text-center shadow-sm">
        <p className="text-brand-black text-lg font-bold tracking-wide uppercase">
          Problem not found
        </p>
        <p className="text-brand-gray-600 mt-3 text-sm">{message}</p>
        <Link
          to={ROUTES.problems}
          search={DEFAULT_PROBLEMS_DASHBOARD_SEARCH}
          className="bg-brand-dark-blue hover:bg-brand-dark-blue/90 mt-6 inline-flex h-10 items-center justify-center rounded-sm px-6 text-xs font-bold tracking-wide text-white uppercase transition-colors"
        >
          Back to problems
        </Link>
      </div>
    </main>
  );
}

export function ProblemDetailsView({ problemId }: ProblemDetailsViewProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProblemTabId>('description');
  const userId = useAuthSessionStore(s => s.user?.id);

  const { data: problem, isLoading, isError, error } =
    useProblemDetailsQuery(problemId);

  const { data: similarProblems = [], isLoading: isSimilarLoading } =
    useSimilarProblemsQuery(problemId);

  const handleBackClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.history.back();
  };

  if (isLoading) {
    return <ProblemDetailsPageSkeleton />;
  }

  if (isError || !problem) {
    const message = isError
      ? getApiErrorMessage(error, {
          invalidCredentialsMessage:
            'We could not load this problem. It may have been removed or you may not have access.',
        })
      : 'This problem does not exist or is no longer available.';
    return <ProblemDetailsErrorState message={message} />;
  }

  const isAuthor =
    problem.viewer.isAuthor || Boolean(userId && userId === problem.authorId);

  const visibleIdeas = problem.linkedIdeas;

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6 bg-white px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleBackClick}
            className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1 text-xs font-bold tracking-wide uppercase transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>

        <ProblemHeader
          problem={problem}
          isAuthor={isAuthor}
          onDeleteSuccess={() => {
            void navigate({
              to: ROUTES.problems,
              search: DEFAULT_PROBLEMS_DASHBOARD_SEARCH,
            });
          }}
        />

        <ProblemTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          counts={{
            attachments: problem.attachments.length,
            linkedIdeas: visibleIdeas.length,
            discussion: 0,
          }}
        />

        <div className="min-h-[280px]">
          <AnimatedPanelSwitch>
            {activeTab === 'description' && (
              <AnimatedPanel
                panelKey="description"
                className="space-y-6"
                aria-label="Description"
              >
                {problem.description ? (
                  <p className="text-brand-gray-800 font-EB-Garamond max-w-3xl text-sm leading-relaxed whitespace-pre-wrap sm:text-base">
                    {problem.description}
                  </p>
                ) : (
                  <p className="text-brand-gray-500 text-sm italic">
                    No description provided yet.
                  </p>
                )}

                <ProblemInfoCards
                  valueProposition={problem.valueProposition}
                  costBenefit={problem.costBenefit}
                />

                <IdeaTagCloud tags={problem.tags} showAll={true} />

                <IdeaStatsFooter
                  createdAt={problem.createdAt}
                  stats={problem.stats}
                  entityId={problem.id}
                  entityType="PROBLEM"
                  isLiked={problem.isLiked}
                />
              </AnimatedPanel>
            )}

            {activeTab === 'attachments' && (
              <AnimatedPanel panelKey="attachments">
                <ProblemAttachmentsTab attachments={problem.attachments} />
              </AnimatedPanel>
            )}

            {activeTab === 'discussion' && (
              <AnimatedPanel panelKey="discussion">
                <div className="py-16 text-center font-medium text-gray-500">
                  This section will be available soon.
                </div>
              </AnimatedPanel>
            )}

            {activeTab === 'linked-ideas' && (
              <AnimatedPanel panelKey="linked-ideas">
                <ProblemLinkedIdeasTab
                  problemId={problemId}
                  ideas={visibleIdeas}
                  isAuthor={isAuthor}
                />
              </AnimatedPanel>
            )}
          </AnimatedPanelSwitch>
        </div>

        {activeTab === 'description' ? (
          <SimilarProblemsWidget
            similarProblems={similarProblems}
            isLoading={isSimilarLoading}
            className={cn('border-brand-gray-200 border-t pt-8')}
          />
        ) : null}
      </div>
    </main>
  );
}
