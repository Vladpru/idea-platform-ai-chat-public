import type { ProfileContributionsTab } from '@/features/profile/model/profile-contributions.types';
import { TabList, type TabDefinition } from '@/shared/ui/TabLabelWithBadge';
import { useMemo, type ReactNode } from 'react';

type TabsLayoutProps = {
  activeTab: ProfileContributionsTab;
  onTabChange: (tab: ProfileContributionsTab) => void;
  isOwner?: boolean;
  children: ReactNode;
};

const BASE_TABS: TabDefinition<ProfileContributionsTab>[] = [
  { id: 'all', label: 'All Contributions' },
  { id: 'idea', label: 'Ideas' },
  { id: 'problem', label: 'Problems' },
  { id: 'joined', label: 'Joined' },
];

const DRAFTS_TAB: TabDefinition<ProfileContributionsTab> = { id: 'drafts', label: 'Drafts' };

export function TabsLayout({
  activeTab,
  onTabChange,
  isOwner = false,
  children,
}: TabsLayoutProps) {
  const tabs = useMemo(
    () => (isOwner ? [...BASE_TABS, DRAFTS_TAB] : BASE_TABS),
    [isOwner],
  );

  return (
    <div>
      <div className="bg-brand-neutral sticky top-0 z-30 pb-4">
        <TabList
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          layoutId="profile-contributions-tabs-underline"
          mobileMode="row"
        />
      </div>

      <div role="tabpanel" aria-label={activeTab}>
        {children}
      </div>
    </div>
  );
}
