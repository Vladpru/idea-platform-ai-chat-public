import type {
  ProblemDetailsCounts,
  ProblemTabId,
} from '@/features/problem-details/model/problem-details.types';

import { cn } from '@/shared/lib/utils';
import { AnimatedTabUnderline } from '@/shared/ui/motion';

type ProblemTabsProps = {
  activeTab: ProblemTabId;
  onChange: (tab: ProblemTabId) => void;
  counts: ProblemDetailsCounts;
};

type TabConfig = {
  id: ProblemTabId;
  label: string;
  countKey?: keyof ProblemDetailsCounts;
};

const TABS: TabConfig[] = [
  { id: 'description', label: 'Description' },
  { id: 'attachments', label: 'Attachments', countKey: 'attachments' },
  { id: 'discussion', label: 'Discussion', countKey: 'discussion' },
  {
    id: 'linked-ideas',
    label: 'Linked Ideas',
    countKey: 'linkedIdeas',
  },
];

const tabsNavClass =
  'scrollbar-none flex gap-4 overflow-x-auto border-b border-gray-200 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-6';

export function ProblemTabs({ activeTab, onChange, counts }: ProblemTabsProps) {
  return (
    <nav className={tabsNavClass} role="tablist" aria-label="Problem sections">
      {TABS.map(tab => {
        const count =
          tab.countKey !== undefined ? counts[tab.countKey] : undefined;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'font-arial relative inline-flex shrink-0 cursor-pointer items-center gap-2 pb-3 text-base font-normal tracking-wide uppercase transition-colors',
              isActive
                ? 'text-brand-dark-blue font-bold'
                : 'text-brand-black hover:text-brand-gray-600',
            )}
          >
            <span>{tab.label}</span>
            {count !== undefined && count > 0 ? (
              <span className="bg-brand-light-blue font-arial inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1 text-sm font-bold tabular-nums transition-colors">
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
