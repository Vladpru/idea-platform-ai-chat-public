export const PDF_EXPORT_QUEUE = 'pdf-export-queue';

export const PDF_EXPORT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
