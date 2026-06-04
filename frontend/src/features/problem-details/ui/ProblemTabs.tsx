import type {
  ProblemDetailsCounts,
  ProblemTabId,
} from '@/features/problem-details/model/problem-details.types';

import { cn } from '@/shared/lib/utils';
import { AnimatedTabUnderline } from '@/shared/ui/motion';

type ProblemTabsProps = {
  activeTab: ProblemTabId;
  onChange: (tab: ProblemTabId) => void;
  counts: Pick<ProblemDetailsCounts, 'attachments' | 'linkedIdeas'>;
  commentCount: number;
};

type TabConfig = {
  id: ProblemTabId;
  label: string;
  countKey?: keyof Pick<ProblemDetailsCounts, 'attachments' | 'linkedIdeas'>;
};

const TABS: TabConfig[] = [
  { id: 'description', label: 'Description' },
  { id: 'attachments', label: 'Attachments', countKey: 'attachments' },
  { id: 'discussion', label: 'Discussion' },
  {
    id: 'linked-ideas',
    label: 'Linked Ideas',
    countKey: 'linkedIdeas',
  },
];

const tabsNavClass =
  'scrollbar-none overflow-y-hidden flex w-full min-w-0 touch-pan-x gap-3 overflow-x-auto overscroll-x-contain border-b border-gray-200 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6';

export function ProblemTabs({
  activeTab,
  onChange,
  counts,
  commentCount,
}: ProblemTabsProps) {
  return (
    <nav className={tabsNavClass} role="tablist" aria-label="Problem sections">
      {TABS.map(tab => {
        const count =
          tab.id === 'discussion'
            ? commentCount
            : tab.countKey !== undefined
              ? counts[tab.countKey]
              : undefined;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'font-arial relative inline-flex shrink-0 cursor-pointer snap-start items-center gap-2 pb-2 text-sm font-normal tracking-wide uppercase transition-colors sm:pb-3 sm:text-base',
              isActive
                ? 'text-brand-dark-blue font-bold'
                : 'text-brand-black hover:text-brand-gray-600',
            )}
          >
            <span className="whitespace-nowrap">{tab.label}</span>
            {count !== undefined && count > 0 ? (
              <span className="bg-brand-light-blue font-arial inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-sm px-1 text-xs font-bold tabular-nums transition-colors sm:h-6 sm:min-w-6 sm:text-sm">
                {count}
              </span>
            ) : null}
            {isActive ? (
              <AnimatedTabUnderline
                layoutId="problem-details-tabs"
                className="bg-brand-orange h-1"
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
