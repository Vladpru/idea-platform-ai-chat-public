import { DEFAULT_COLUMN_COUNT } from '@/shared/dashboard/lib/config/constants';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ProblemsDashboardGridPreferencesState = {
  columnCount: number;
  linkedIdeasExpanded: boolean;
  setColumnCount: (columnCount: number) => void;
  expandAllLinkedIdeas: () => void;
  collapseAllLinkedIdeas: () => void;
};

type PersistedProblemsDashboardGridPreferences = Pick<
  ProblemsDashboardGridPreferencesState,
  'columnCount' | 'linkedIdeasExpanded'
>;

export const useProblemsDashboardGridPreferencesStore =
  create<ProblemsDashboardGridPreferencesState>()(
    persist(
      set => ({
        columnCount: DEFAULT_COLUMN_COUNT,
        linkedIdeasExpanded: true,
        setColumnCount: columnCount => set({ columnCount }),
        expandAllLinkedIdeas: () => set({ linkedIdeasExpanded: true }),
        collapseAllLinkedIdeas: () => set({ linkedIdeasExpanded: false }),
      }),
      {
        name: 'problems-dashboard-grid-preferences',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state): PersistedProblemsDashboardGridPreferences => ({
          columnCount: state.columnCount,
          linkedIdeasExpanded: state.linkedIdeasExpanded,
        }),
      },
    ),
  );
