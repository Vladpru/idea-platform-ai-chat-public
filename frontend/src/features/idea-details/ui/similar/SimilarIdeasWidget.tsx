import type {
  SimilarIdeaCard,
  SimilarIdeasSubTab,
} from '@/features/idea-details/model/idea-details.types';

import { Globe } from 'lucide-react';

import { useState } from 'react';

import { cn } from '@/shared/lib/utils';

import { StarsIcon } from '@/shared/ui/icons';

import { AnimatedTabUnderline } from '@/shared/ui/motion';

import { SimilarIdeasRowSkeleton } from '../skeletons/SimilarIdeasRowSkeleton';

import { SimilarIdeaCard as SimilarIdeaCardUi } from './SimilarIdeaCard';

type SimilarIdeasWidgetProps = {
  ideaId: string;

  similarIdeas: SimilarIdeaCard[];

  isLoading: boolean;

  className?: string;
};

type TabConfig = {
  id: SimilarIdeasSubTab;

  label: string;

  icon: React.ReactNode;

  count: number;
};

export function SimilarIdeasWidget({
  similarIdeas,

  isLoading,

  className,
}: SimilarIdeasWidgetProps) {
  const [activeSubTab, setActiveSubTab] =
    useState<SimilarIdeasSubTab>('IDEA_ENGINE');

  const subTabsConfig: TabConfig[] = [
    {
      id: 'IDEA_ENGINE',

      label: 'Idea Engine',

      icon: <StarsIcon className="size-3.5" />,

      count: similarIdeas.length,
    },

    {
      id: 'FOUND_ON_WEB',

      label: 'Found on Web',

      icon: <Globe className="size-3.5" />,

      count: 0,
    },
  ];

  const showEmpty =
    !isLoading && activeSubTab === 'IDEA_ENGINE' && similarIdeas.length === 0;

  return (
    <section
      className={cn('space-y-6 pt-10', className)}
      aria-label="Similar ideas"
    >
      <div className="flex items-center gap-2">
        <StarsIcon className="text-brand-gray-900 size-5 sm:size-6" />

        <h2 className="text-brand-gray-950 font-arial text-lg font-bold tracking-tight uppercase sm:text-xl">
          Similar ideas
        </h2>
      </div>

      <div className="border-brand-gray-200 border-b">
        <div
          className="flex scrollbar-none gap-4 overflow-x-auto [-ms-overflow-style:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {subTabsConfig.map(tab => {
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  'font-arial group relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 pb-3 text-sm font-normal tracking-wide uppercase transition-colors sm:text-base',

                  isActive
                    ? 'text-brand-dark-blue font-bold'
                    : 'text-brand-dark-blue hover:text-brand-dark-blue/90',
                )}
              >
                <span className={cn('text-brand-dark-blue transition-colors')}>
                  {tab.icon}
                </span>

                <span>{tab.label}</span>

                <span
                  className={cn(
                    'bg-brand-light-blue inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1 text-sm font-bold tabular-nums transition-colors',

                    isActive
                      ? 'text-brand-dark-blue'
                      : 'group-hover:bg-brand-gray-200',
                  )}
                >
                  {tab.count}
                </span>

                {isActive ? (
                  <AnimatedTabUnderline
                    layoutId="similar-ideas-sub-tabs"
                    className="bg-brand-orange h-1"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <SimilarIdeasRowSkeleton />
      ) : activeSubTab === 'FOUND_ON_WEB' ? (
        <div className="border-brand-gray-200 text-brand-gray-600 rounded-lg border border-dashed bg-white px-6 py-12 text-center">
          <Globe className="text-brand-gray-400 mx-auto size-8" />

          <p className="mt-3 text-sm font-semibold tracking-wide uppercase">
            Found on Web is coming soon
          </p>

          <p className="text-brand-gray-500 mx-auto mt-1 max-w-sm text-xs">
            We are working on global web search to find overlapping topics
            across Reddit, Product Hunt, and the wider internet.
          </p>
        </div>
      ) : showEmpty ? (
        <div className="border-brand-gray-200 text-brand-gray-600 rounded-lg border border-dashed bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold tracking-wide uppercase">
            No similar ideas yet
          </p>

          <p className="mt-2 text-sm">
            Published ideas with overlapping topics will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {similarIdeas.map(card => (
            <SimilarIdeaCardUi key={card.id} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}
