import { ConferenceInviteStatus } from '../../../generated/prisma/client';
import {
  formatAuthorDisplayName,
  toLiveChatAuthorResponse,
} from '../live-chat/live-chat.mapper';
import type { ConferenceRecord } from './conference.records';
import type { ConferenceTeamMemberRecord } from './conference.repository';
import type {
  ConferenceDto,
  ConferenceEntityType,
  SuggestedSpeakerDto,
  SuggestedSpeakerInviteState,
} from './types/conference.types';

function toIsoString(date: Date): string {
  return date.toISOString();
}

function toNullableIsoString(date: Date | null): string | null {
  return date ? toIsoString(date) : null;
}

function resolveConferenceEntity(conference: ConferenceRecord): {
  entityType: ConferenceEntityType;
  entityId: string;
} {
  if (conference.ideaId !== null) {
    return { entityType: 'IDEA', entityId: conference.ideaId };
  }

  if (conference.problemId !== null) {
    return { entityType: 'PROBLEM', entityId: conference.problemId };
  }

  throw new Error(
    `Conference ${conference.id} is missing both ideaId and problemId`,
  );
}

export function toConferenceResponse(
  conference: ConferenceRecord,
): ConferenceDto {
  const { entityType, entityId } = resolveConferenceEntity(conference);

  return {
    id: conference.id,
    entityType,
    entityId,
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
  user: ConferenceTeamMemberRecord;
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
