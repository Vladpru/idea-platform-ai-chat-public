import type {
  IdeaDetails,
  IdeaDetailsCounts,
  IdeaTabId,
} from '@/features/idea-details/model/idea-details.types';

import { cn } from '@/shared/lib/utils';
import { AnimatedTabUnderline } from '@/shared/ui/motion';

type IdeaTabsProps = {
  activeTab: IdeaTabId;
  onChange: (tab: IdeaTabId) => void;
  idea: Pick<IdeaDetails, 'commentCount'>;
  counts: Pick<IdeaDetailsCounts, 'attachments' | 'linkedProblems'>;
};

type TabConfig = {
  id: IdeaTabId;
  label: string;
  countKey?: keyof IdeaDetailsCounts;
};

const TABS: TabConfig[] = [
  { id: 'description', label: 'Description' },
  { id: 'attachments', label: 'Attachments', countKey: 'attachments' },
  { id: 'discussion', label: 'Discussion', countKey: 'discussion' },
  {
    id: 'linked-problems',
    label: 'Linked Problems',
    countKey: 'linkedProblems',
  },
];

const tabsNavClass =
  'scrollbar-none flex w-full min-w-0 touch-pan-x gap-3 overflow-x-auto overscroll-x-contain border-b border-gray-200 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6';

export function IdeaTabs({
  activeTab,
  onChange,
  idea,
  counts,
}: IdeaTabsProps) {
  const tabCounts: IdeaDetailsCounts = {
    attachments: counts.attachments,
    linkedProblems: counts.linkedProblems,
    discussion: idea.commentCount,
  };

  return (
    <nav
      className={cn(tabsNavClass, 'mt-2')}
      role="tablist"
      aria-label="Idea sections"
    >
      {TABS.map(tab => {
        const count =
          tab.countKey !== undefined ? tabCounts[tab.countKey] : undefined;
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
                layoutId="idea-details-tabs"
                className="bg-brand-orange h-1"
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
