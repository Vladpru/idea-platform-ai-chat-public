import { AnimatePresence, motion } from 'framer-motion';

import {
  DashboardFilter,
  type DashboardFilterTab,
} from '@/features/ideas-dashboard';

function TabLabelWithBadge({
  label,
  count,
}: {
  label: string;
  count?: number;
}) {
  return (
    <span className="flex items-center gap-2">
      {label}
      <AnimatePresence>
        {count !== undefined && (
          <motion.span
            key={`badge-${label}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="bg-brand-light-blue text-brand-dark-blue flex size-6 items-center justify-center rounded-sm text-xs font-semibold tabular-nums"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export type TabDefinition<T extends string> = {
  id: T;
  label: string;
  count?: number;
};

type TabListProps<T extends string> = {
  tabs: TabDefinition<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  layoutId: string;
  mobileMode?: 'drawer' | 'row';
};

export function TabList<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  layoutId,
  mobileMode,
}: TabListProps<T>) {
  const filters = tabs.map(t => ({
    id: t.id,
    label: <TabLabelWithBadge label={t.label} count={t.count} />,
  })) satisfies DashboardFilterTab<T>[];

  return (
    <DashboardFilter
      filters={filters}
      activeFilter={activeTab}
      onFilterChange={onTabChange}
      ariaLabel="Dashboard tabs"
      layoutId={layoutId}
      mobileMode={mobileMode}
    />
  );
}
