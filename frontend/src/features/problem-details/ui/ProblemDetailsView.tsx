import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { ConferenceBanner } from '@/features/conference/ui/ConferenceBanner';
import { ScheduleConferenceDialog } from '@/features/conference/ui/ScheduleConferenceDialog';
import { DiscussionTab } from '@/features/discussion/ui/DiscussionTab';
import { EntityAiSummaryBlock } from '@/features/entity-ai-summary/EntityAiSummaryBlock';
import { IdeaStatsFooter } from '@/features/idea-details/ui/IdeaStatsFooter';
import { IdeaTagCloud } from '@/features/idea-details/ui/IdeaTagCloud';
import {
  useProblemDetailsQuery,
  useSimilarProblemsQuery,
} from '@/features/problem-details/lib/use-problem-details-queries';
import { ProblemTeamModal } from '@/features/problem-details/modals/ProblemTeamModal';
import type { ProblemTabId } from '@/features/problem-details/model/problem-details.types';
import { DEFAULT_PROBLEMS_DASHBOARD_SEARCH } from '@/features/problems-dashboard/lib/constants';
import {
  PROBLEM_UPDATED_SUCCESS_DESCRIPTION,
  PROBLEM_UPDATED_SUCCESS_TITLE,
} from '@/features/problems/lib/modals/copy';
import { NotFoundPage } from '@/pages/not-found';
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ROUTES } from '@/shared/config/paths';
import { entityDescriptionDetailClass } from '@/shared/lib/entity-description-classes';
import { SyncWarningBanner } from '@/shared/offline/SyncWarningBanner';
import { cn } from '@/shared/lib/utils';
import { AnimatedPanel, AnimatedPanelSwitch } from '@/shared/ui/motion';
import { SuccessModal } from '@/shared/ui/success-modal';

import { ProblemHeader } from './ProblemHeader';
import { ProblemInfoCards } from './ProblemInfoCards';
import { ProblemTabs } from './ProblemTabs';
import { ProblemAttachmentsTab } from './attachments/ProblemAttachmentsTab';
import { ProblemLinkedIdeasTab } from './linked-ideas/ProblemLinkedIdeasTab';
import { SimilarProblemsWidget } from './similar/SimilarProblemsWidget';
import { ProblemDetailsPageSkeleton } from './skeletons/ProblemDetailsPageSkeleton';

type ProblemDetailsViewProps = {
  problemId: string;
};

export function ProblemDetailsView({ problemId }: ProblemDetailsViewProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const {
    updated: showUpdatedSuccess,
    replyTo: replyToCommentId,
    tab: searchTab,
    sort: discussionSort,
  } = useSearch({
    from: '/_auth/problems/$problemId',
  });
  const [activeTab, setActiveTab] = useState<ProblemTabId>(() => {
    if (replyToCommentId || searchTab === 'discussion') {
      return 'discussion';
    }
    return 'description';
  });
  const searchTabOverride: ProblemTabId | null =
    replyToCommentId || searchTab === 'discussion' ? 'discussion' : null;
  const visibleTab = searchTabOverride ?? activeTab;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isScheduleConferenceOpen, setIsScheduleConferenceOpen] =
    useState(false);
  const [updatedSuccessOpen, setUpdatedSuccessOpen] = useState(false);
  const [prevShowUpdatedSuccess, setPrevShowUpdatedSuccess] =
    useState(showUpdatedSuccess);
  const userId = useAuthSessionStore(s => s.user?.id);
  const mainRef = useRef<HTMLElement>(null);

  if (showUpdatedSuccess !== prevShowUpdatedSuccess) {
    setPrevShowUpdatedSuccess(showUpdatedSuccess);
    if (showUpdatedSuccess) {
      setUpdatedSuccessOpen(true);
    }
  }

  const {
    data: problem,
    isPending,
    isError,
    isSuccess,
  } = useProblemDetailsQuery(problemId);

  const { data: similarProblems = [], isLoading: isSimilarLoading } =
    useSimilarProblemsQuery(problemId, {
      enabled: isSuccess && Boolean(problem),
    });

  const handleBackClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.history.back();
  };

  const applyTabChange = useCallback(
    (tab: ProblemTabId) => {
      setActiveTab(tab);

      if (replyToCommentId || searchTab === 'discussion') {
        void navigate({
          to: ROUTES.problemDetail(problemId),
          search: previous => {
            const next = { ...previous };
            delete next.tab;
            delete next.replyTo;
            return next;
          },
          replace: true,
        });
      }
    },
    [navigate, problemId, replyToCommentId, searchTab],
  );

  const handleReplyToConsumed = useCallback(() => {
    setActiveTab('discussion');
    void navigate({
      to: '/problems/$problemId',
      params: { problemId },
      search: {
        tab: 'discussion',
        ...(discussionSort ? { sort: discussionSort } : {}),
        ...(showUpdatedSuccess ? { updated: showUpdatedSuccess } : {}),
      },
      replace: true,
    });
  }, [discussionSort, navigate, problemId, showUpdatedSuccess]);

  useEffect(() => {
    if (!showUpdatedSuccess) {
      return;
    }

    void navigate({
      to: ROUTES.problemDetail(problemId),
      search: previous => {
        const next = { ...previous };
        delete next.updated;
        return next;
      },
      replace: true,
    });
  }, [navigate, problemId, showUpdatedSuccess]);

  useEffect(() => {
    const scrollEl = mainRef.current?.parentElement;
    if (!scrollEl) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = scrollEl.scrollTop;
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
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, [isPending]);

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
    <main ref={mainRef} className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="bg-card mx-auto max-w-5xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        <SyncWarningBanner entity="problem" localId={problemId} />
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

        <div className="bg-card sticky top-0 z-30 -mx-4 px-4 py-3 shadow-none transition-all duration-300 sm:-mx-6 sm:px-6">
          <ProblemHeader
            problem={problem}
            isAuthor={isAuthor}
            isCompact={isScrolled}
            onScheduleConference={() => setIsScheduleConferenceOpen(true)}
            onDeleteSuccess={() => {
              void navigate({
                to: ROUTES.problems,
                search: DEFAULT_PROBLEMS_DASHBOARD_SEARCH,
              });
            }}
            onBackClick={handleBackClick}
            onTeamClick={() => setIsTeamModalOpen(true)}
          />

          <div className="pt-1">
            <ProblemTabs
              activeTab={visibleTab}
              onChange={applyTabChange}
              commentCount={problem.commentCount}
              counts={{
                attachments: problem.attachments.length,
                linkedIdeas: visibleIdeas.length,
              }}
            />
          </div>
        </div>

        <ConferenceBanner
          entityType="PROBLEM"
          entityId={problem.id}
          authorId={problem.authorId}
        />

        <div className="min-h-[280px]">
          <AnimatedPanelSwitch>
            {visibleTab === 'description' && (
              <AnimatedPanel
                panelKey="description"
                className="space-y-6"
                aria-label="Description"
              >
                <EntityAiSummaryBlock
                  aiSummary={problem.aiSummary}
                  summaryStatus={problem.summaryStatus}
                />
                {problem.description ? (
                  <p className={entityDescriptionDetailClass}>
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

            {visibleTab === 'attachments' && (
              <AnimatedPanel panelKey="attachments">
                <ProblemAttachmentsTab attachments={problem.attachments} />
              </AnimatedPanel>
            )}

            {visibleTab === 'discussion' && (
              <AnimatedPanel panelKey="discussion">
                <DiscussionTab
                  entityType="PROBLEM"
                  entityId={problemId}
                  enabled={visibleTab === 'discussion'}
                  replyToCommentId={replyToCommentId}
                  onReplyToConsumed={handleReplyToConsumed}
                />
              </AnimatedPanel>
            )}

            {visibleTab === 'linked-ideas' && (
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

        {visibleTab === 'description' ? (
          <SimilarProblemsWidget
            similarProblems={similarProblems}
            isLoading={isSimilarLoading}
            className={cn('border-brand-gray-200 border-t pt-8')}
          />
        ) : null}
      </div>

      {isTeamModalOpen ? (
        <ProblemTeamModal
          problemId={problem.id}
          author={problem.author}
          members={problem.members}
          viewer={problem.viewer}
          onClose={() => setIsTeamModalOpen(false)}
        />
      ) : null}

      {isAuthor ? (
        <ScheduleConferenceDialog
          entityType="PROBLEM"
          entityId={problem.id}
          open={isScheduleConferenceOpen}
          onOpenChange={setIsScheduleConferenceOpen}
        />
      ) : null}

      <SuccessModal
        open={updatedSuccessOpen}
        onOpenChange={setUpdatedSuccessOpen}
        title={PROBLEM_UPDATED_SUCCESS_TITLE}
        description={PROBLEM_UPDATED_SUCCESS_DESCRIPTION}
        onClose={() => setUpdatedSuccessOpen(false)}
      />
    </main>
  );
}
