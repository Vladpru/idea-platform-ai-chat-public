import { exportProblemPdf } from '@/features/problems/api/problems.api';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export function useExportProblemPdfMutation() {
  return useMutation({
    mutationKey: ['problems', 'export-pdf'],
    mutationFn: (problemId: string) => exportProblemPdf(problemId),
    onSuccess: () => {
      toast.info("Generating your PDF — you'll be notified when it's ready");
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
