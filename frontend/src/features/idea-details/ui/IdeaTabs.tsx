import type {
  IdeaDetailsCounts,
  IdeaTabId,
} from '@/features/idea-details/model/idea-details.types';

import { cn } from '@/shared/lib/utils';

type IdeaTabsProps = {
  activeTab: IdeaTabId;
  onChange: (tab: IdeaTabId) => void;
  counts: IdeaDetailsCounts;
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

const TAB_BORDER_CLASS = 'border-b-4';

const tabsNavClass =
  'scrollbar-none flex gap-4 overflow-x-auto border-b border-gray-200 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-6';

export function IdeaTabs({ activeTab, onChange, counts }: IdeaTabsProps) {
  return (
    <nav className={tabsNavClass} role="tablist" aria-label="Idea sections">
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
              'font-arial inline-flex shrink-0 cursor-pointer items-center gap-2 pb-3 text-base font-normal tracking-wide uppercase transition-colors',
              TAB_BORDER_CLASS,
              isActive
                ? 'border-brand-orange text-brand-dark-blue font-bold'
                : 'text-brand-black border-transparent hover:text-[#0A2540]/80',
            )}
          >
            <span>{tab.label}</span>
            {count !== undefined && count > 0 ? (
              <span className="bg-brand-light-blue font-arial inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1 text-sm font-bold tabular-nums transition-colors">
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
