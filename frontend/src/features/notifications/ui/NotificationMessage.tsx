import type { ReactNode } from 'react';

import type { NotificationPayload } from '../api/notifications.types';
import { NotificationActorBadge } from './NotificationActorBadge';

function readString(payload: NotificationPayload, key: string): string {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

type NotificationMessageProps = {
  type: string;
  payload: NotificationPayload;
};

function renderWithActor(
  actorName: string | null,
  suffix: ReactNode,
): ReactNode {
  if (!actorName) {
    return (
      <>
        Someone
        {suffix}
      </>
    );
  }

  return (
    <>
      <NotificationActorBadge name={actorName} className="mr-1 align-middle" />
      {suffix}
    </>
  );
}

export function NotificationMessage({ type, payload }: NotificationMessageProps) {
  const actorName = readString(payload, 'actorName') || null;
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
      return renderWithActor(
        actorName,
        <>
          {' '}
          commented on your {entityType} &quot;{entityTitle || title}&quot;: &quot;
          {contentSnippet}&quot;
        </>,
      );
    case 'idea.status.changed':
    case 'problem.status.changed': {
      const statusLine = nextStage
        ? `${nextStatus} (${nextStage})`
        : nextStatus || 'updated';
      const entityLabel = type.startsWith('idea.') ? 'idea' : 'problem';

      return renderWithActor(
        actorName,
        <>
          {' '}
          updated {entityLabel} &quot;{title}&quot; to {statusLine}.
        </>,
      );
    }
    case 'idea.supporter.added':
    case 'problem.supporter.added':
      return renderWithActor(
        actorName,
        <>
          {' '}
          supported your {entityType} &quot;{entityTitle || title}&quot;.
        </>,
      );
    case 'similar.idea.detected':
      return (
        <>
          A new idea &quot;{matchedEntityTitle || title}&quot; may be similar to
          your &quot;{sourceEntityTitle || title}&quot;.
        </>
      );
    case 'similar.problem.detected':
      return (
        <>
          A new problem &quot;{matchedEntityTitle || title}&quot; may be similar
          to your &quot;{sourceEntityTitle || title}&quot;.
        </>
      );
    case 'followup.required':
      return (
        <>
          Your {entityType} draft &quot;{entityTitle || title}&quot; has been
          inactive. Consider updating or publishing it.
        </>
      );
    case 'NEW_IDEA':
      return renderWithActor(
        actorName,
        <>
          {' '}
          published a new idea &quot;{ideaTitle || title}&quot;.
        </>,
      );
    case 'NEW_PROBLEM':
      return renderWithActor(
        actorName,
        <>
          {' '}
          published a new problem &quot;{problemTitle || title}&quot;.
        </>,
      );
    default:
      return <>You have a new notification.</>;
  }
}
