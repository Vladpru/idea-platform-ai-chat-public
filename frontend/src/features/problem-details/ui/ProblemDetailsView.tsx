import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { DiscussionTab } from '@/features/discussion/ui/DiscussionTab';
import { IdeaStatsFooter } from '@/features/idea-details/ui/IdeaStatsFooter';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import {
  useProblemDetailsQuery,
  useSimilarProblemsQuery,
} from '@/features/problem-details/lib/use-problem-details-queries';
import { DEFAULT_PROBLEMS_DASHBOARD_SEARCH } from '@/features/problems-dashboard/lib/constants';
import type { ProblemTabId } from '@/features/problem-details/model/problem-details.types';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { type MouseEvent, useEffect, useState } from 'react';

import { ROUTES } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { AnimatedPanel, AnimatedPanelSwitch } from '@/shared/ui/motion';

import { ProblemAttachmentsTab } from './attachments/ProblemAttachmentsTab';
import { ProblemHeader } from './ProblemHeader';
import { ProblemInfoCards } from './ProblemInfoCards';
import { ProblemLinkedIdeasTab } from './linked-ideas/ProblemLinkedIdeasTab';
import { ProblemTabs } from './ProblemTabs';
import { SimilarProblemsWidget } from './similar/SimilarProblemsWidget';
import { NotFoundPage } from '@/pages/not-found';

import { ProblemDetailsPageSkeleton } from './skeletons/ProblemDetailsPageSkeleton';

type ProblemDetailsViewProps = {
  problemId: string;
};

export function ProblemDetailsView({ problemId }: ProblemDetailsViewProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProblemTabId>('description');
  const [isScrolled, setIsScrolled] = useState(false);
  const userId = useAuthSessionStore(s => s.user?.id);

  const { data: problem, isPending, isError, isSuccess } =
    useProblemDetailsQuery(problemId);

  const { data: similarProblems = [], isLoading: isSimilarLoading } =
    useSimilarProblemsQuery(problemId, {
      enabled: isSuccess && Boolean(problem),
    });

  const handleBackClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.history.back();
  };

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setIsScrolled(prev => {
            if (scrollY > 150 && !prev) return true;
            if (scrollY < 80 && prev) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPending) {
    return <ProblemDetailsPageSkeleton />;
  }

  if (isError || !problem) {
    return <NotFoundPage variant="content" />;
  }

  const isAuthor =
    problem.viewer.isAuthor || Boolean(userId && userId === problem.authorId);

  const visibleIdeas = problem.linkedIdeas;

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6 bg-white px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        <AnimatePresence>
          {!isScrolled ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center pb-2">
                <button
                  type="button"
                  onClick={handleBackClick}
                  className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1 text-xs font-bold tracking-wide uppercase transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="sticky top-[56px] z-30 -mx-4 bg-white px-4 py-3 shadow-sm transition-all duration-300 sm:-mx-6 sm:px-6">
          <ProblemHeader
            problem={problem}
            isAuthor={isAuthor}
            isCompact={isScrolled}
            onDeleteSuccess={() => {
              void navigate({
                to: ROUTES.problems,
                search: DEFAULT_PROBLEMS_DASHBOARD_SEARCH,
              });
            }}
            onBackClick={handleBackClick}
          />

          <div className="pt-1">
            <ProblemTabs
              activeTab={activeTab}
              onChange={setActiveTab}
              commentCount={problem.commentCount}
              counts={{
                attachments: problem.attachments.length,
                linkedIdeas: visibleIdeas.length,
              }}
            />
          </div>
        </div>

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
                <DiscussionTab
                  entityType="PROBLEM"
                  entityId={problemId}
                  enabled={activeTab === 'discussion'}
                />
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
