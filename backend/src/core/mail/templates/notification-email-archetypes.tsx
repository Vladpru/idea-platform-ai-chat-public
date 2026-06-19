import { Text } from '@react-email/components';
import * as React from 'react';

import type { EnrichedEmailContext } from '../types/enriched-email.types';
import { EmailActorRow } from './components/EmailActorRow';
import { EmailCtaGroup } from './components/EmailCtaGroup';
import { EmailEntityCard } from './components/EmailEntityCard';
import { EmailOutlineButton } from './components/EmailOutlineButton';
import { EmailSerifText } from './components/EmailSerifText';
import { TransactionalEmail } from './components/TransactionalEmail';
import { emailClasses } from './components/email-tokens';

type CtaConfig = {
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  outline?: { href: string; label: string };
};

type BaseArchetypeProps = {
  preview: string;
  fallback: React.ReactNode;
  enriched?: EnrichedEmailContext;
};

export function CommentEmailArchetype({
  preview,
  enriched,
  fallback,
}: BaseArchetypeProps) {
  const comment = enriched?.comment;

  if (!comment) {
    return (
      <TransactionalEmail preview={preview} headline={preview.toUpperCase()}>
        {fallback}
      </TransactionalEmail>
    );
  }

  return (
    <TransactionalEmail
      preview={preview}
      splitHeadline={{
        prefix: `${comment.actorName.toUpperCase()} LEFT A NEW COMMENT IN:`,
        accent: comment.entityTitle.toUpperCase(),
      }}
    >
      <EmailActorRow
        name={comment.actorName}
        avatarUrl={comment.actorAvatarUrl}
        timestamp={comment.timestamp || undefined}
      />
      <EmailSerifText>{comment.contentSnippet}</EmailSerifText>
      <EmailOutlineButton href={comment.replyUrl} label="Reply" />
    </TransactionalEmail>
  );
}

export function EntityEmailArchetype({
  preview,
  splitHeadline,
  headline,
  subheading,
  enriched,
  fallback,
  cta,
}: BaseArchetypeProps & {
  splitHeadline?: { prefix: string; accent: string };
  headline?: string;
  subheading?: string;
  cta: CtaConfig;
}) {
  const entity = enriched?.entity;

  return (
    <TransactionalEmail
      preview={preview}
      headline={headline}
      splitHeadline={splitHeadline}
      subheading={subheading}
    >
      {entity ? <EmailEntityCard entity={entity} /> : fallback}
      {cta.outline ? (
        <EmailOutlineButton href={cta.outline.href} label={cta.outline.label} />
      ) : (
        <EmailCtaGroup primary={cta.primary} secondary={cta.secondary} />
      )}
    </TransactionalEmail>
  );
}

export function ActionEmailArchetype({
  preview,
  headline,
  subheading,
  enriched,
  fallback,
  cta,
}: BaseArchetypeProps & {
  headline: string;
  subheading?: string;
  cta: CtaConfig;
}) {
  const entity = enriched?.entity;

  return (
    <TransactionalEmail
      preview={preview}
      headline={headline}
      subheading={subheading}
    >
      {entity ? <EmailEntityCard entity={entity} /> : fallback}
      <EmailCtaGroup primary={cta.primary} secondary={cta.secondary} />
    </TransactionalEmail>
  );
}

export function InformationalEmailArchetype({
  preview,
  headline,
  subheading,
  children,
}: {
  preview: string;
  headline: string;
  subheading?: string;
  children: React.ReactNode;
}) {
  return (
    <TransactionalEmail
      preview={preview}
      headline={headline}
      subheading={subheading}
    >
      {children}
    </TransactionalEmail>
  );
}

export function FallbackBodyText({ children }: { children: React.ReactNode }) {
  return <Text className={emailClasses.bodyText}>{children}</Text>;
}
