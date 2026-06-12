import type { IdeaConferenceStatus } from '../../../generated/prisma/client';
import type { LiveChatAuthorDto } from '../../live-chat/types/live-chat.types';

export type IdeaConferenceDto = {
  id: string;
  ideaId: string;
  scheduledBy: LiveChatAuthorDto;
  title: string;
  description: string | null;
  status: IdeaConferenceStatus;
  scheduledFor: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
};

export type IdeaConferenceListResponse = {
  conferences: IdeaConferenceDto[];
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
  conference: IdeaConferenceDto;
};
