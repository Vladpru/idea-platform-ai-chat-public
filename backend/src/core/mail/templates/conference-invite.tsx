import { Text, render } from '@react-email/components';
import * as React from 'react';

import { EmailCtaGroup } from './components/EmailCtaGroup';
import { TransactionalEmail } from './components/TransactionalEmail';
import { emailClasses } from './components/email-tokens';

interface ConferenceInviteEmailProps {
  inviteUrl: string;
  expiresDays: number;
}

const ConferenceInviteEmailTemplate = ({
  inviteUrl,
  expiresDays,
}: ConferenceInviteEmailProps) => {
  const previewText = `You're invited to a conference - The Idea Platform`;

  return (
    <TransactionalEmail
      preview={previewText}
      headline="YOU'RE INVITED"
      subheading="Conference Invitation"
      disclaimer="If you did not expect this invitation, you can safely ignore this email."
    >
      <Text className={emailClasses.bodyText}>
        You have been invited to join a conference on The Idea Platform. Click
        the button below to view the details and accept your invitation.
      </Text>

      <EmailCtaGroup primary={{ href: inviteUrl, label: 'View Invitation' }} />

      <Text className={emailClasses.bodyText}>
        This invitation will expire in <strong>{expiresDays} days</strong>.
      </Text>
    </TransactionalEmail>
  );
};

export async function buildConferenceInviteEmail(params: {
  inviteUrl: string;
  expiresDays: number;
}) {
  const { inviteUrl, expiresDays } = params;
  const subject = "You're invited to a conference";

  const html = await render(
    <ConferenceInviteEmailTemplate
      inviteUrl={inviteUrl}
      expiresDays={expiresDays}
    />,
  );

  const text = await render(
    <ConferenceInviteEmailTemplate
      inviteUrl={inviteUrl}
      expiresDays={expiresDays}
    />,
    { plainText: true },
  );

  return { subject, text, html };
}
