import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_COLUMN_COUNT } from '@/shared/dashboard/lib/config/constants';

type DashboardGridPreferencesState = {
  columnCount: number;
  linkedProblemsExpanded: boolean;
  setColumnCount: (columnCount: number) => void;
  expandAllLinkedProblems: () => void;
  collapseAllLinkedProblems: () => void;
};

type PersistedDashboardGridPreferences = Pick<
  DashboardGridPreferencesState,
  'columnCount' | 'linkedProblemsExpanded'
>;

export const useDashboardGridPreferencesStore =
  create<DashboardGridPreferencesState>()(
    persist(
      set => ({
        columnCount: DEFAULT_COLUMN_COUNT,
        linkedProblemsExpanded: true,
        setColumnCount: columnCount => set({ columnCount }),
        expandAllLinkedProblems: () => set({ linkedProblemsExpanded: true }),
        collapseAllLinkedProblems: () =>
          set({ linkedProblemsExpanded: false }),
      }),
      {
        name: 'dashboard-grid-preferences',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state): PersistedDashboardGridPreferences => ({
          columnCount: state.columnCount,
          linkedProblemsExpanded: state.linkedProblemsExpanded,
        }),
      },
    ),
  );
