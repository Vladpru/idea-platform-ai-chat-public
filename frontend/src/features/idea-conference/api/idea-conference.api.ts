import { api } from '@/shared/api/http';

import { IDEA_CONFERENCE_ROUTES } from './idea-conference.routes';
import type {
  ConferenceInviteDto,
  CreateConferenceInvitePayload,
  IdeaConferenceDto,
  IdeaConferenceListResponse,
  JoinConferenceResponse,
  ScheduleIdeaConferencePayload,
  SuggestedSpeakersResponse,
  UpdateConferencePayload,
} from './idea-conference-api.types';

export async function fetchIdeaConferences(
  ideaId: string,
): Promise<IdeaConferenceListResponse> {
  const { data } = await api.get<IdeaConferenceListResponse>(
    IDEA_CONFERENCE_ROUTES.conferences(ideaId),
  );
  return data;
}

export async function fetchSuggestedSpeakers(
  ideaId: string,
  conferenceId?: string,
): Promise<SuggestedSpeakersResponse> {
  const { data } = await api.get<SuggestedSpeakersResponse>(
    IDEA_CONFERENCE_ROUTES.suggestedSpeakers(ideaId),
    {
      params: conferenceId ? { conferenceId } : undefined,
    },
  );
  return data;
}

export async function scheduleIdeaConference(
  ideaId: string,
  payload: ScheduleIdeaConferencePayload,
): Promise<IdeaConferenceDto> {
  const { data } = await api.post<IdeaConferenceDto>(
    IDEA_CONFERENCE_ROUTES.conferences(ideaId),
    payload,
  );
  return data;
}

export async function inviteConferenceSpeaker(
  ideaId: string,
  conferenceId: string,
  payload: CreateConferenceInvitePayload,
): Promise<ConferenceInviteDto> {
  const { data } = await api.post<ConferenceInviteDto>(
    IDEA_CONFERENCE_ROUTES.invites(ideaId, conferenceId),
    payload,
  );
  return data;
}

export async function joinIdeaConference(
  ideaId: string,
  conferenceId: string,
): Promise<JoinConferenceResponse> {
  const { data } = await api.post<JoinConferenceResponse>(
    IDEA_CONFERENCE_ROUTES.join(ideaId, conferenceId),
  );
  return data;
}

export async function updateIdeaConference(
  ideaId: string,
  conferenceId: string,
  payload: UpdateConferencePayload,
): Promise<IdeaConferenceDto> {
  const { data } = await api.patch<IdeaConferenceDto>(
    IDEA_CONFERENCE_ROUTES.conference(ideaId, conferenceId),
    payload,
  );
  return data;
}
