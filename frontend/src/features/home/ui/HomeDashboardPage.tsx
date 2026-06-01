import { Link } from '@tanstack/react-router';
import { StatMetricCard } from '@/features/statistics/ui/StatMetricCard';
import { statisticsPageTitleClass } from '@/features/statistics/ui/statistics-classes';
import {
  Activity,
  BarChart3,
  Lightbulb,
  Plus,
  Search,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';

import { ROUTES } from '@/shared/config/paths';
import { formatUserDisplayName } from '@/shared/lib/user-display';
import { Card } from '@/shared/ui';
import { Button } from '@/shared/ui/button';
import { SkeletonCard } from '@/shared/ui/skeleton';

import { useHomeOverview } from '../hooks/use-home-overview';
import { HOME_LABELS } from '../lib/home-labels';
import { HomeActivityCard } from './HomeActivityCard';
import { HomeQuickLinkCard } from './HomeQuickLinkCard';

function HomeSectionSkeleton() {
  return <SkeletonCard className="h-40" />;
}

export function HomeDashboardPage() {
  const {
    user,
    ideasTotals,
    problemsTotals,
    statistics,
    isActivityLoading,
    isStatisticsLoading,
    hasActivityError,
    hasStatisticsError,
    refetch,
  } = useHomeOverview();

  const displayName = user
    ? formatUserDisplayName({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
    : 'there';

  const quickLinks = [
    {
      to: ROUTES.problems,
      search: { sort: 'newest' },
      title: HOME_LABELS.quickLinks.problems.title,
      description: HOME_LABELS.quickLinks.problems.description,
      icon: TriangleAlert,
    },
    {
      to: ROUTES.ideas,
      search: { sort: 'newest' },
      title: HOME_LABELS.quickLinks.ideas.title,
      description: HOME_LABELS.quickLinks.ideas.description,
      icon: Lightbulb,
    },
    {
      to: ROUTES.problemsNew,
      title: HOME_LABELS.quickLinks.addProblem.title,
      description: HOME_LABELS.quickLinks.addProblem.description,
      icon: Plus,
      accentClassName: 'bg-brand-dark-blue text-white',
    },
    {
      to: ROUTES.ideasNew,
      title: HOME_LABELS.quickLinks.addIdea.title,
      description: HOME_LABELS.quickLinks.addIdea.description,
      icon: Plus,
      accentClassName: 'bg-brand-orange text-white',
    },
    {
      to: ROUTES.search,
      search: { q: '', t: 'ideas' },
      title: HOME_LABELS.quickLinks.search.title,
      description: HOME_LABELS.quickLinks.search.description,
      icon: Search,
    },
    {
      to: ROUTES.statistics,
      title: HOME_LABELS.quickLinks.statistics.title,
      description: HOME_LABELS.quickLinks.statistics.description,
      icon: BarChart3,
    },
  ] as const;

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl 2xl:max-w-6xl">
        <Card className="text-card-foreground min-h-[calc(100vh-56px)] rounded-none bg-white p-6 md:p-10">
          <h1 className={statisticsPageTitleClass}>{HOME_LABELS.pageTitle}</h1>
          <p className="text-brand-dark-blue mt-3 text-xl font-semibold">
            {HOME_LABELS.welcome(displayName)}
          </p>
          <p className="text-brand-gray-700 mt-2 max-w-2xl text-sm">
            {HOME_LABELS.subtitle}
          </p>

          {(hasActivityError || hasStatisticsError) && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-brand-gray-700 text-sm">
                {HOME_LABELS.loadError}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={refetch}
              >
                {HOME_LABELS.tryAgain}
              </Button>
            </div>
          )}

          <section className="mt-8" aria-labelledby="home-quick-actions">
            <h2
              id="home-quick-actions"
              className="text-brand-dark-blue text-lg font-bold"
            >
              {HOME_LABELS.quickActionsTitle}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map(link => (
                <HomeQuickLinkCard key={link.to + link.title} {...link} />
              ))}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="home-your-activity">
            <h2
              id="home-your-activity"
              className="text-brand-dark-blue text-lg font-bold"
            >
              {HOME_LABELS.yourActivityTitle}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {isActivityLoading ? (
                <>
                  <HomeSectionSkeleton />
                  <HomeSectionSkeleton />
                </>
              ) : (
                <>
                  <HomeActivityCard
                    title={HOME_LABELS.ideasCardTitle}
                    icon={Lightbulb}
                    metrics={[
                      {
                        label: HOME_LABELS.published,
                        value: ideasTotals?.published ?? 0,
                        to: ROUTES.profileIdeas,
                        search: { tab: 'published' },
                      },
                      {
                        label: HOME_LABELS.drafts,
                        value: ideasTotals?.drafts ?? 0,
                        to: ROUTES.profileIdeas,
                        search: { tab: 'drafts' },
                      },
                      {
                        label: HOME_LABELS.joined,
                        value: ideasTotals?.joined ?? 0,
                        to: ROUTES.profileIdeas,
                        search: { tab: 'joined' },
                      },
                    ]}
                  />
                  <HomeActivityCard
                    title={HOME_LABELS.problemsCardTitle}
                    icon={TriangleAlert}
                    metrics={[
                      {
                        label: HOME_LABELS.published,
                        value: problemsTotals?.published ?? 0,
                        to: ROUTES.profileProblems,
                        search: { tab: 'published' },
                      },
                      {
                        label: HOME_LABELS.drafts,
                        value: problemsTotals?.drafts ?? 0,
                        to: ROUTES.profileProblems,
                        search: { tab: 'drafts' },
                      },
                      {
                        label: HOME_LABELS.joined,
                        value: problemsTotals?.joined ?? 0,
                        to: ROUTES.profileProblems,
                        search: { tab: 'joined' },
                      },
                    ]}
                  />
                </>
              )}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="home-platform-activity">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="home-platform-activity"
                className="text-brand-dark-blue text-lg font-bold"
              >
                {HOME_LABELS.platformActivityTitle}
              </h2>
              <Link
                to={ROUTES.statistics}
                className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
              >
                {HOME_LABELS.viewStatistics}
              </Link>
            </div>

            {isStatisticsLoading ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <HomeSectionSkeleton />
                <HomeSectionSkeleton />
              </div>
            ) : statistics ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <StatMetricCard
                  title="Users"
                  icon={UserPlus}
                  metrics={statistics.users}
                />
                <StatMetricCard
                  title="Activity"
                  icon={Activity}
                  metrics={statistics.activity}
                />
              </div>
            ) : null}
          </section>
        </Card>
      </div>
    </main>
  );
}
