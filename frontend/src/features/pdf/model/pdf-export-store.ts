import { create } from 'zustand';

type PdfExportState = {
  exportingIds: Record<string, boolean>;
  startExport: (entityId: string) => void;
  finishExport: (entityId: string) => void;
};

export const usePdfExportStore = create<PdfExportState>()(set => ({
  exportingIds: {},
  startExport: (entityId: string) =>
    set(state => ({
      exportingIds: { ...state.exportingIds, [entityId]: true },
    })),
  finishExport: (entityId: string) =>
    set(state => {
      const { [entityId]: _, ...rest } = state.exportingIds;
      return { exportingIds: rest };
    }),
}));
