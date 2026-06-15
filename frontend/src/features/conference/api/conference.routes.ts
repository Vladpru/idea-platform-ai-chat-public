import type {
  ConferenceEntity,
  ConferenceEntityType,
} from './conference-api.types';

function entitySegment(entityType: ConferenceEntityType): 'ideas' | 'problems' {
  return entityType === 'IDEA' ? 'ideas' : 'problems';
}

function conferencesBase({ entityType, entityId }: ConferenceEntity): string {
  return `/${entitySegment(entityType)}/${entityId}/conferences`;
}

export const CONFERENCE_ROUTES = {
  conferences: (entity: ConferenceEntity) => conferencesBase(entity),
  suggestedSpeakers: (entity: ConferenceEntity) =>
    `${conferencesBase(entity)}/suggested-speakers`,
  conference: (entity: ConferenceEntity, conferenceId: string) =>
    `${conferencesBase(entity)}/${conferenceId}`,
  invites: (entity: ConferenceEntity, conferenceId: string) =>
    `${conferencesBase(entity)}/${conferenceId}/invites`,
  join: (entity: ConferenceEntity, conferenceId: string) =>
    `${conferencesBase(entity)}/${conferenceId}/join`,
} as const;
