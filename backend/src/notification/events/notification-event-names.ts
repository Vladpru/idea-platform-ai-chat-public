export const NOTIFICATION_EVENTS = {
  COMMENT_CREATED: 'comment.created',
  STATUS_CHANGED: 'status.changed',
  IDEA_STATUS_CHANGED: 'idea.status.changed',
  PROBLEM_STATUS_CHANGED: 'problem.status.changed',
  IDEA_SUPPORTER_ADDED: 'idea.supporter.added',
  PROBLEM_SUPPORTER_ADDED: 'problem.supporter.added',
  SIMILAR_FOUND: 'similar.found',
  SIMILAR_IDEA_DETECTED: 'similar.idea.detected',
  SIMILAR_PROBLEM_DETECTED: 'similar.problem.detected',
  FOLLOWUP_REQUIRED: 'followup.required',
  IDEA_ASSIGNED: 'idea.assigned',
  PROBLEM_ASSIGNED: 'problem.assigned',
  NEW_IDEA: 'NEW_IDEA',
  NEW_PROBLEM: 'NEW_PROBLEM',
} as const;

export type NotificationEventName =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];
