export type NotificationPreferenceKey =
  | 'newSimilarIdeas'
  | 'newSimilarProblems'
  | 'statusChange'
  | 'newSupporters'
  | 'newComments'
  | 'assignedIdeasAndProblems'
  | 'followUps'
  | 'directMessages';

export type NotificationChannelPreferences = {
  inApp: boolean;
  email: boolean;
};

export type NotificationPreferencesMap = Record<
  NotificationPreferenceKey,
  NotificationChannelPreferences
>;

export type NotificationDispatchInput = {
  recipientUserId: string;
  preferenceKey: NotificationPreferenceKey;
  notificationType: string;
  payload: Record<string, unknown>;
};

export type CommentCreatedNotificationEvent = {
  recipientUserId: string;
  commentId: string;
  entityType: 'idea' | 'problem';
  entityId: string;
  entityTitle: string;
  actorId: string;
  actorName: string;
  contentSnippet: string;
};

export type IdeaStatusChangedNotificationEvent = {
  recipientUserId: string;
  ideaId: string;
  ideaTitle: string;
  actorId: string;
  actorName: string;
  previousStatus: string | null;
  previousStage: string | null;
  nextStatus: string;
  nextStage: string | null;
};

export type ProblemStatusChangedNotificationEvent = {
  recipientUserId: string;
  problemId: string;
  problemTitle: string;
  actorId: string;
  actorName: string;
  previousStatus: string | null;
  previousStage: string | null;
  nextStatus: string;
  nextStage: string | null;
};

export type SupporterAddedNotificationEvent = {
  recipientUserId: string;
  entityType: 'idea' | 'problem';
  entityId: string;
  entityTitle: string;
  actorId: string;
  actorName: string;
};

export type SimilarItemDetectedNotificationEvent = {
  recipientUserId: string;
  entityType: 'idea' | 'problem';
  sourceEntityId: string;
  sourceEntityTitle: string;
  matchedEntityId: string;
  matchedEntityTitle: string;
};

export type FollowUpRequiredNotificationEvent = {
  recipientUserId: string;
  entityType: 'idea' | 'problem';
  entityId: string;
  entityTitle: string;
  draftUpdatedAt: string;
};

export type StatusChangedNotificationEvent = {
  entityType: 'idea' | 'problem';
  entityId: string;
  entityTitle: string;
  actorId: string;
  actorName: string;
  recipientUserIds: string[];
  previousStatus: string | null;
  previousStage: string | null;
  nextStatus: string;
  nextStage: string | null;
};

export type SimilarFoundMatch = {
  matchedEntityId: string;
  matchedEntityTitle: string;
  recipientUserId: string;
};

export type SimilarFoundNotificationEvent = {
  entityType: 'idea' | 'problem';
  sourceEntityId: string;
  sourceEntityTitle: string;
  matches: SimilarFoundMatch[];
};

export type AssignmentNotificationEvent = {
  recipientUserId: string;
  entityType: 'idea' | 'problem';
  entityId: string;
  entityTitle: string;
  assignerId: string;
  assignerName: string;
};

export type DirectMessageReceivedNotificationEvent = {
  recipientUserId: string;
  roomId: string;
  messageId: string;
  actorId: string;
  actorName: string;
  contentSnippet: string;
};
