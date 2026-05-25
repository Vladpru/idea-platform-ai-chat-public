import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_COLUMN_COUNT } from '../lib/constants';
import type {
  IdeaDashboardFilter,
  IdeaDashboardSort,
} from './ideas-dashboard.types';

type DashboardGridPreferencesState = {
  columnCount: number;
  activeFilter: IdeaDashboardFilter;
  sort: IdeaDashboardSort;
  linkedProblemsExpanded: boolean;
  setColumnCount: (columnCount: number) => void;
  setActiveFilter: (activeFilter: IdeaDashboardFilter) => void;
  setSort: (sort: IdeaDashboardSort) => void;
  expandAllLinkedProblems: () => void;
  collapseAllLinkedProblems: () => void;
};

type PersistedDashboardGridPreferences = Pick<
  DashboardGridPreferencesState,
  'columnCount' | 'activeFilter' | 'sort' | 'linkedProblemsExpanded'
>;

export const useDashboardGridPreferencesStore =
  create<DashboardGridPreferencesState>()(
    persist(
      set => ({
        columnCount: DEFAULT_COLUMN_COUNT,
        activeFilter: 'ALL',
        sort: 'newest',
        linkedProblemsExpanded: true,
        setColumnCount: columnCount => set({ columnCount }),
        setActiveFilter: activeFilter => set({ activeFilter }),
        setSort: sort => set({ sort }),
        expandAllLinkedProblems: () => set({ linkedProblemsExpanded: true }),
        collapseAllLinkedProblems: () =>
          set({ linkedProblemsExpanded: false }),
      }),
      {
        name: 'dashboard-grid-preferences',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state): PersistedDashboardGridPreferences => ({
          columnCount: state.columnCount,
          activeFilter: state.activeFilter,
          sort: state.sort,
          linkedProblemsExpanded: state.linkedProblemsExpanded,
        }),
      },
    ),
  );
