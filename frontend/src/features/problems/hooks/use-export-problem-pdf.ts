import { exportProblemPdf } from '@/features/problems/api/problems.api';
import { usePdfExportStore } from '@/features/pdf/model/pdf-export-store';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export function useExportProblemPdfMutation() {
  const startExport = usePdfExportStore(state => state.startExport);
  const finishExport = usePdfExportStore(state => state.finishExport);

  return useMutation({
    mutationKey: ['problems', 'export-pdf'],
    mutationFn: (problemId: string) => exportProblemPdf(problemId),
    onSuccess: (_data, problemId) => {
      startExport(problemId);
      toast.info("Generating your PDF — you'll be notified when it's ready");
    },
    onError: (error, problemId) => {
      finishExport(problemId);
      toast.error(getApiErrorMessage(error));
    },
  });
}
