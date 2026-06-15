import { api } from '@/shared/api/http';

import { CONFERENCE_ROUTES } from './conference.routes';
import type {
  ConferenceDto,
  ConferenceEntity,
  ConferenceInviteDto,
  ConferenceListResponse,
  CreateConferenceInvitePayload,
  JoinConferenceResponse,
  ScheduleConferencePayload,
  SuggestedSpeakersResponse,
  UpdateConferencePayload,
} from './conference-api.types';

export async function fetchConferences(
  entity: ConferenceEntity,
): Promise<ConferenceListResponse> {
  const { data } = await api.get<ConferenceListResponse>(
    CONFERENCE_ROUTES.conferences(entity),
  );
  return data;
}

export async function fetchSuggestedSpeakers(
  entity: ConferenceEntity,
  conferenceId?: string,
): Promise<SuggestedSpeakersResponse> {
  const { data } = await api.get<SuggestedSpeakersResponse>(
    CONFERENCE_ROUTES.suggestedSpeakers(entity),
    {
      params: conferenceId ? { conferenceId } : undefined,
    },
  );
  return data;
}

export async function scheduleConference(
  entity: ConferenceEntity,
  payload: ScheduleConferencePayload,
): Promise<ConferenceDto> {
  const { data } = await api.post<ConferenceDto>(
    CONFERENCE_ROUTES.conferences(entity),
    payload,
  );
  return data;
}

export async function inviteConferenceSpeaker(
  entity: ConferenceEntity,
  conferenceId: string,
  payload: CreateConferenceInvitePayload,
): Promise<ConferenceInviteDto> {
  const { data } = await api.post<ConferenceInviteDto>(
    CONFERENCE_ROUTES.invites(entity, conferenceId),
    payload,
  );
  return data;
}

export async function joinConference(
  entity: ConferenceEntity,
  conferenceId: string,
): Promise<JoinConferenceResponse> {
  const { data } = await api.post<JoinConferenceResponse>(
    CONFERENCE_ROUTES.join(entity, conferenceId),
  );
  return data;
}

export async function updateConference(
  entity: ConferenceEntity,
  conferenceId: string,
  payload: UpdateConferencePayload,
): Promise<ConferenceDto> {
  const { data } = await api.patch<ConferenceDto>(
    CONFERENCE_ROUTES.conference(entity, conferenceId),
    payload,
  );
  return data;
}
