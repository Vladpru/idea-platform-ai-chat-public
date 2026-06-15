import { ROUTES } from '@/shared/config/paths';

import type {
  ConferenceEntity,
  ConferenceEntityType,
} from '@/features/conference/api/conference-api.types';

export function getConferencePath(
  { entityType, entityId }: ConferenceEntity,
  conferenceId: string,
): string {
  return entityType === 'IDEA'
    ? ROUTES.ideaConference(entityId, conferenceId)
    : ROUTES.problemConference(entityId, conferenceId);
}

export function getEntityDetailPath({
  entityType,
  entityId,
}: ConferenceEntity): string {
  return entityType === 'IDEA'
    ? ROUTES.ideaDetail(entityId)
    : ROUTES.problemDetail(entityId);
}

export function getEntityNoun(entityType: ConferenceEntityType): string {
  return entityType === 'IDEA' ? 'idea' : 'problem';
}
