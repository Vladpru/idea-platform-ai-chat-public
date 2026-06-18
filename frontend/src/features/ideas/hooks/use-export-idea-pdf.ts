import { exportIdeaPdf } from '@/features/ideas/api/ideas.api';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export function useExportIdeaPdfMutation() {
  return useMutation({
    mutationKey: ['ideas', 'export-pdf'],
    mutationFn: (ideaId: string) => exportIdeaPdf(ideaId),
    onSuccess: () => {
      toast.info("Generating your PDF — you'll be notified when it's ready");
    },
    onError: error => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
