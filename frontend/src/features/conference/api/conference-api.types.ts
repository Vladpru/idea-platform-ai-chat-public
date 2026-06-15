import type { LiveChatAuthorDto } from '@/features/live-chat/api/live-chat-api.types';

export type ConferenceEntityType = 'IDEA' | 'PROBLEM';

export type ConferenceEntity = {
  entityType: ConferenceEntityType;
  entityId: string;
};

export type ConferenceStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

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

export type ScheduleConferencePayload = {
  title: string;
  description?: string;
  scheduledFor: string;
  speakerUserIds?: string[];
};

export type CreateConferenceInvitePayload = {
  userId?: string;
  email?: string;
};

export type ConferenceInviteDto = {
  id: string;
  conferenceId: string;
  inviteType: 'PLATFORM_USER' | 'EXTERNAL_EMAIL';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  userId: string | null;
  email: string | null;
  createdAt: string;
};

export type ConferenceRole = 'speaker' | 'listener';

export type JoinConferenceResponse = {
  token: string;
  livekitUrl: string;
  role: ConferenceRole;
  conference: ConferenceDto;
};

export type UpdateConferencePayload = {
  action: 'start' | 'end' | 'cancel';
};
