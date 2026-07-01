import { exportIdeaPdf } from '@/features/ideas/api/ideas.api';
import { usePdfExportStore } from '@/features/pdf/model/pdf-export-store';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export function useExportIdeaPdfMutation() {
  const startExport = usePdfExportStore(state => state.startExport);
  const finishExport = usePdfExportStore(state => state.finishExport);

  return useMutation({
    mutationKey: ['ideas', 'export-pdf'],
    mutationFn: (ideaId: string) => exportIdeaPdf(ideaId),
    onSuccess: (_data, ideaId) => {
      startExport(ideaId);
      toast.info("Generating your PDF — you'll be notified when it's ready");
    },
    onError: (error, ideaId) => {
      finishExport(ideaId);
      toast.error(getApiErrorMessage(error));
    },
  });
}
