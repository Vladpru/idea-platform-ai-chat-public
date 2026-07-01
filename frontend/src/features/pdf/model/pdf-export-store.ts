import { create } from 'zustand';

type PdfExportState = {
  exportingIds: Set<string>;
  startExport: (entityId: string) => void;
  finishExport: (entityId: string) => void;
};

export const usePdfExportStore = create<PdfExportState>()(set => ({
  exportingIds: new Set(),
  startExport: (entityId: string) =>
    set(state => ({
      exportingIds: new Set([...state.exportingIds, entityId]),
    })),
  finishExport: (entityId: string) =>
    set(state => {
      const next = new Set(state.exportingIds);
      next.delete(entityId);
      return { exportingIds: next };
    }),
}));

export function isExportingPdf(entityId: string): boolean {
  return usePdfExportStore.getState().exportingIds.has(entityId);
}
