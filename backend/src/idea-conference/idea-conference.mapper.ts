import { ConferenceInviteStatus } from '../../generated/prisma/client';
import {
  formatAuthorDisplayName,
  toLiveChatAuthorResponse,
} from '../live-chat/live-chat.mapper';
import type { IdeaConferenceRecord } from './idea-conference.records';
import type { IdeaTeamMemberRecord } from './idea-conference.repository';
import type {
  IdeaConferenceDto,
  SuggestedSpeakerDto,
  SuggestedSpeakerInviteState,
} from './types/idea-conference.types';

function toIsoString(date: Date): string {
  return date.toISOString();
}

function toNullableIsoString(date: Date | null): string | null {
  return date ? toIsoString(date) : null;
}

export function toIdeaConferenceResponse(
  conference: IdeaConferenceRecord,
): IdeaConferenceDto {
  return {
    id: conference.id,
    ideaId: conference.ideaId,
    scheduledBy: toLiveChatAuthorResponse(conference.scheduledBy),
    title: conference.title,
    description: conference.description,
    status: conference.status,
    scheduledFor: toIsoString(conference.scheduledFor),
    startedAt: toNullableIsoString(conference.startedAt),
    endedAt: toNullableIsoString(conference.endedAt),
    createdAt: toIsoString(conference.createdAt),
  };
}

export function buildConferenceProviderRoomName(conferenceId: string): string {
  return `ic-${conferenceId}`;
}

export function toInviteState(
  status: ConferenceInviteStatus | undefined,
): SuggestedSpeakerInviteState {
  if (status === ConferenceInviteStatus.PENDING) {
    return 'invited';
  }

  if (status === ConferenceInviteStatus.ACCEPTED) {
    return 'accepted';
  }

  return 'not_invited';
}

export function toSuggestedSpeakerResponse(params: {
  user: IdeaTeamMemberRecord;
  roleLabel: string;
  inviteState: SuggestedSpeakerInviteState;
}): SuggestedSpeakerDto {
  return {
    userId: params.user.id,
    name: formatAuthorDisplayName(params.user),
    avatarUrl: params.user.avatarUrl,
    roleLabel: params.roleLabel,
    inviteState: params.inviteState,
  };
}

export function mapInviteStateByUserId(
  invites: Array<{ userId: string | null; status: ConferenceInviteStatus }>,
): Map<string, ConferenceInviteStatus> {
  const inviteStateByUserId = new Map<string, ConferenceInviteStatus>();

  for (const invite of invites) {
    if (invite.userId) {
      inviteStateByUserId.set(invite.userId, invite.status);
    }
  }

  return inviteStateByUserId;
}
