import * as React from 'react';

import type { EnrichedEmailContext } from '../types/enriched-email.types';
import type {
  NotificationEmailContent,
  NotificationEmailJobData,
} from '../types/notification-email.types';
import {
  ActionEmailArchetype,
  CommentEmailArchetype,
  EntityEmailArchetype,
  FallbackBodyText,
  InformationalEmailArchetype,
} from './notification-email-archetypes';

function readString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === 'string' ? value : '';
}

function buildCommentCreatedContent(
  payload: Record<string, unknown>,
): NotificationEmailContent {
  const actorName = readString(payload, 'actorName');
  const entityTitle = readString(payload, 'entityTitle');
  const contentSnippet = readString(payload, 'contentSnippet');
  const entityType = readString(payload, 'entityType');

  const subject = `New comment on ${entityTitle || 'your item'}`;
  const text = `${actorName} commented on your ${entityType}: "${contentSnippet}"`;

  return { subject, text, html: '' };
}

function buildStatusChangedContent(
  payload: Record<string, unknown>,
  entityLabel: string,
): NotificationEmailContent {
  const actorName = readString(payload, 'actorName');
  const title =
    readString(payload, 'ideaTitle') || readString(payload, 'problemTitle');
  const nextStatus = readString(payload, 'nextStatus');
  const nextStage = readString(payload, 'nextStage');

  const subject = `${entityLabel} status updated: ${title || 'Untitled'}`;
  const statusLine = nextStage
    ? `${nextStatus} (${nextStage})`
    : nextStatus || 'updated';
  const text = `${actorName} updated ${entityLabel} "${title}" to ${statusLine}.`;

  return { subject, text, html: '' };
}

function buildSupporterAddedContent(
  payload: Record<string, unknown>,
): NotificationEmailContent {
  const actorName = readString(payload, 'actorName');
  const entityTitle = readString(payload, 'entityTitle');
  const entityType = readString(payload, 'entityType');

  const subject = `New supporter for ${entityTitle || 'your item'}`;
  const text = `${actorName} supported your ${entityType} "${entityTitle}".`;

  return { subject, text, html: '' };
}

function buildSimilarDetectedContent(
  payload: Record<string, unknown>,
  entityLabel: string,
): NotificationEmailContent {
  const sourceTitle = readString(payload, 'sourceEntityTitle');
  const matchedTitle = readString(payload, 'matchedEntityTitle');

  const subject = `New similar ${entityLabel} detected`;
  const text = `A new ${entityLabel} "${matchedTitle}" may be similar to your "${sourceTitle}".`;

  return { subject, text, html: '' };
}

function buildFollowUpContent(
  payload: Record<string, unknown>,
): NotificationEmailContent {
  const entityTitle = readString(payload, 'entityTitle');
  const entityType = readString(payload, 'entityType');

  const subject = `Reminder: revisit your draft ${entityTitle || ''}`.trim();
  const text = `Your ${entityType} draft "${entityTitle}" has been inactive. Consider updating or publishing it.`;

  return { subject, text, html: '' };
}

function buildGenericContent(
  notificationType: string,
): NotificationEmailContent {
  const subject = 'Notification from Idea Platform';
  const text = `You have a new notification (${notificationType}).`;

  return { subject, text, html: '' };
}

export function resolveNotificationEmailContent(
  data: NotificationEmailJobData,
): NotificationEmailContent {
  switch (data.notificationType) {
    case 'comment.created':
      return buildCommentCreatedContent(data.payload);
    case 'idea.status.changed':
      return buildStatusChangedContent(data.payload, 'idea');
    case 'problem.status.changed':
      return buildStatusChangedContent(data.payload, 'problem');
    case 'idea.supporter.added':
    case 'problem.supporter.added':
      return buildSupporterAddedContent(data.payload);
    case 'similar.idea.detected':
      return buildSimilarDetectedContent(data.payload, 'idea');
    case 'similar.problem.detected':
      return buildSimilarDetectedContent(data.payload, 'problem');
    case 'followup.required':
      return buildFollowUpContent(data.payload);
    default:
      return buildGenericContent(data.notificationType);
  }
}

export function renderNotificationEmail(
  data: NotificationEmailJobData,
  content: NotificationEmailContent,
  enriched?: EnrichedEmailContext,
): React.ReactElement {
  const payload = data.payload;
  const preview = content.subject;
  const baseUrl = enriched?.frontendUrl ?? 'https://idea-platform.com';
  const settingsUrl =
    enriched?.settingsUrl ?? `${baseUrl}/settings/notifications`;

  switch (data.notificationType) {
    case 'comment.created': {
      const actorName = readString(payload, 'actorName');
      const entityTitle = readString(payload, 'entityTitle');
      const contentSnippet = readString(payload, 'contentSnippet');
      const entityType = readString(payload, 'entityType');

      return (
        <CommentEmailArchetype
          preview={preview}
          enriched={enriched}
          fallback={
            <>
              <FallbackBodyText>
                <strong>{actorName}</strong> commented on your {entityType}{' '}
                <strong>{entityTitle}</strong>.
              </FallbackBodyText>
              <FallbackBodyText>{contentSnippet}</FallbackBodyText>
            </>
          }
        />
      );
    }
    case 'idea.status.changed':
    case 'problem.status.changed': {
      const entityLabel =
        data.notificationType === 'idea.status.changed' ? 'idea' : 'problem';
      const actorName = readString(payload, 'actorName');
      const title =
        readString(payload, 'ideaTitle') || readString(payload, 'problemTitle');
      const nextStatus = readString(payload, 'nextStatus');
      const nextStage = readString(payload, 'nextStage');
      const statusLine = nextStage
        ? `${nextStatus} (${nextStage})`
        : nextStatus || 'updated';
      const entity = enriched?.entity;
      const openLabel = entityLabel === 'idea' ? 'Open Idea' : 'Open Problem';

      return (
        <EntityEmailArchetype
          preview={preview}
          splitHeadline={{
            prefix: `STATUS CHANGED TO ${statusLine.toUpperCase()}:`,
            accent: (title || 'Untitled').toUpperCase(),
          }}
          enriched={enriched}
          fallback={
            <FallbackBodyText>
              <strong>{actorName}</strong> updated {entityLabel}{' '}
              <strong>{title}</strong> to <strong>{statusLine}</strong>.
            </FallbackBodyText>
          }
          cta={{
            outline: {
              href: entity?.detailUrl ?? baseUrl,
              label: openLabel,
            },
          }}
        />
      );
    }
    case 'idea.supporter.added':
    case 'problem.supporter.added': {
      const actorName = readString(payload, 'actorName');
      const entityTitle = readString(payload, 'entityTitle');
      const entityType = readString(payload, 'entityType');
      const entity = enriched?.entity;
      const openLabel = entityType === 'problem' ? 'Open Problem' : 'Open Idea';

      return (
        <EntityEmailArchetype
          preview={preview}
          headline={preview.toUpperCase()}
          subheading={entityTitle || undefined}
          enriched={enriched}
          fallback={
            <FallbackBodyText>
              <strong>{actorName}</strong> supported your {entityType}{' '}
              <strong>{entityTitle}</strong>.
            </FallbackBodyText>
          }
          cta={{
            outline: {
              href: entity?.detailUrl ?? baseUrl,
              label: openLabel,
            },
          }}
        />
      );
    }
    case 'similar.idea.detected':
    case 'similar.problem.detected': {
      const entityLabel =
        data.notificationType === 'similar.idea.detected' ? 'idea' : 'problem';
      const sourceTitle = readString(payload, 'sourceEntityTitle');
      const matchedTitle = readString(payload, 'matchedEntityTitle');
      const entity = enriched?.entity;

      return (
        <EntityEmailArchetype
          preview={preview}
          headline={`WE FOUND A ${entityLabel.toUpperCase()} SIMILAR TO "${(sourceTitle || 'YOUR PROJECT').toUpperCase()}"`}
          enriched={enriched}
          fallback={
            <FallbackBodyText>
              A new {entityLabel} <strong>{matchedTitle}</strong> may be similar
              to your <strong>{sourceTitle}</strong>.
            </FallbackBodyText>
          }
          cta={{
            primary: {
              href: entity?.detailUrl ?? baseUrl,
              label: 'View Similar Projects',
            },
            secondary: {
              href: settingsUrl,
              label: 'Turn Off Follow-Ups',
            },
          }}
        />
      );
    }
    case 'followup.required': {
      const entityTitle = readString(payload, 'entityTitle');
      const entityType = readString(payload, 'entityType');
      const entity = enriched?.entity;
      const primaryLabel =
        entityType === 'problem' ? 'Complete My Problem' : 'Finish My Idea';
      const primaryHref = entity?.editUrl ?? entity?.detailUrl ?? baseUrl;

      return (
        <ActionEmailArchetype
          preview={preview}
          headline={preview.toUpperCase()}
          subheading={entityTitle || undefined}
          enriched={enriched}
          fallback={
            <FallbackBodyText>
              Your {entityType} draft <strong>{entityTitle}</strong> has been
              inactive. Consider updating or publishing it.
            </FallbackBodyText>
          }
          cta={{
            primary: { href: primaryHref, label: primaryLabel },
            secondary: {
              href: settingsUrl,
              label: 'Turn Off Follow-Ups',
            },
          }}
        />
      );
    }
    default:
      return (
        <InformationalEmailArchetype
          preview={preview}
          headline={preview.toUpperCase()}
        >
          <FallbackBodyText>
            You have a new notification (
            <strong>{data.notificationType}</strong>).
          </FallbackBodyText>
          <FallbackBodyText>
            {JSON.stringify(payload, null, 2)}
          </FallbackBodyText>
        </InformationalEmailArchetype>
      );
  }
}
