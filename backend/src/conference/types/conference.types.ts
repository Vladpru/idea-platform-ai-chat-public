import type { ConferenceStatus } from '../../../generated/prisma/client';
import type { LiveChatAuthorDto } from '../../live-chat/types/live-chat.types';

export type ConferenceEntityType = 'IDEA' | 'PROBLEM';

export type ConferenceDto = {
  id: string;
  entityType: ConferenceEntityType;
  entityId: string;
  scheduledBy: LiveChatAuthorDto;
  title: string;
  description: string | null;
  status: ConferenceStatus;
  scheduledFor: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type ConferenceListResponse = {
  conferences: ConferenceDto[];
};

export type SuggestedSpeakerInviteState =
  | 'not_invited'
  | 'invited'
  | 'accepted';

export type SuggestedSpeakerDto = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  roleLabel: string;
  inviteState: SuggestedSpeakerInviteState;
};

export type SuggestedSpeakersResponse = {
  conferenceId: string | null;
  speakers: SuggestedSpeakerDto[];
};

export type ConferenceRole = 'speaker' | 'listener';

export type JoinConferenceResponse = {
  token: string;
  livekitUrl: string;
  role: ConferenceRole;
  conference: ConferenceDto;
};
