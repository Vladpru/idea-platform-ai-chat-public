import type { ConferenceInviteRecord } from './conference-invite.repository';
import type {
  ConferenceInviteDto,
  ConferenceInvitePreviewDto,
} from './types/conference-invite.types';

function toIsoString(date: Date): string {
  return date.toISOString();
}

export function toConferenceInviteResponse(
  invite: ConferenceInviteRecord,
): ConferenceInviteDto {
  return {
    id: invite.id,
    conferenceId: invite.conferenceId,
    inviteType: invite.inviteType,
    status: invite.status,
    userId: invite.userId,
    email: invite.email,
    createdAt: toIsoString(invite.createdAt),
  };
}

export function toConferenceInvitePreviewResponse(params: {
  conferenceTitle: string;
  entityTitle: string | null;
  scheduledFor: Date;
}): ConferenceInvitePreviewDto {
  return {
    conferenceTitle: params.conferenceTitle,
    entityTitle: params.entityTitle,
    scheduledFor: toIsoString(params.scheduledFor),
  };
}
