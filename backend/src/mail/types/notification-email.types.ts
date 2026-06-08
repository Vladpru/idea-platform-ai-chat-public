import type { EnrichedEmailContext } from './enriched-email.types';

export type NotificationEmailPreferenceKey =
  | 'newSimilarIdeas'
  | 'newSimilarProblems'
  | 'statusChange'
  | 'newSupporters'
  | 'newComments'
  | 'assignedIdeasAndProblems'
  | 'followUps';

export type NotificationEmailContent = {
  subject: string;
  text: string;
  html: string;
};

export type NotificationEmailJobData = {
  to: string;
  preferenceKey: NotificationEmailPreferenceKey;
  notificationType: string;
  payload: Record<string, unknown>;
};

export type NotificationEmailBuildInput = NotificationEmailJobData & {
  enriched?: EnrichedEmailContext;
};
