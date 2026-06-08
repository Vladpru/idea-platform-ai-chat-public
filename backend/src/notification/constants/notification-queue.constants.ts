export const NOTIFICATION_EMAIL_QUEUE = 'notification-email-queue';

export const NOTIFICATION_EMAIL_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
