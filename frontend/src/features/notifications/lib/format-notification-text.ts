import type { NotificationPayload } from '../api/notifications.types';

function readString(payload: NotificationPayload, key: string): string {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

export function formatNotificationText(
  type: string,
  payload: NotificationPayload,
): string {
  const actorName = readString(payload, 'actorName') || 'Someone';
  const entityTitle = readString(payload, 'entityTitle');
  const ideaTitle = readString(payload, 'ideaTitle');
  const problemTitle = readString(payload, 'problemTitle');
  const entityType = readString(payload, 'entityType');
  const contentSnippet = readString(payload, 'contentSnippet');
  const nextStatus = readString(payload, 'nextStatus');
  const nextStage = readString(payload, 'nextStage');
  const sourceEntityTitle = readString(payload, 'sourceEntityTitle');
  const matchedEntityTitle = readString(payload, 'matchedEntityTitle');
  const title =
    ideaTitle || problemTitle || entityTitle || sourceEntityTitle || 'Untitled';

  switch (type) {
    case 'comment.created':
      return `${actorName} commented on your ${entityType} "${entityTitle || title}": "${contentSnippet}"`;
    case 'idea.status.changed':
    case 'problem.status.changed': {
      const statusLine = nextStage
        ? `${nextStatus} (${nextStage})`
        : nextStatus || 'updated';
      const entityLabel = type.startsWith('idea.') ? 'idea' : 'problem';
      return `${actorName} updated ${entityLabel} "${title}" to ${statusLine}.`;
    }
    case 'idea.supporter.added':
    case 'problem.supporter.added':
      return `${actorName} supported your ${entityType} "${entityTitle || title}".`;
    case 'similar.idea.detected':
      return `A new idea "${matchedEntityTitle || title}" may be similar to your "${sourceEntityTitle || title}".`;
    case 'similar.problem.detected':
      return `A new problem "${matchedEntityTitle || title}" may be similar to your "${sourceEntityTitle || title}".`;
    case 'followup.required':
      return `Your ${entityType} draft "${entityTitle || title}" has been inactive. Consider updating or publishing it.`;
    case 'NEW_IDEA':
      return `${actorName} published a new idea "${ideaTitle || title}".`;
    case 'NEW_PROBLEM':
      return `${actorName} published a new problem "${problemTitle || title}".`;
    default:
      return `You have a new notification.`;
  }
}
