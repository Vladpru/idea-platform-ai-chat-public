import type { ConferenceEntity } from '@/features/conference/api/conference-api.types';

export const conferenceQueryKeys = {
  all: ['conferences'] as const,
  byEntity: ({ entityType, entityId }: ConferenceEntity) =>
    [...conferenceQueryKeys.all, entityType, entityId] as const,
  suggestedSpeakers: (entity: ConferenceEntity, conferenceId?: string) =>
    [
      ...conferenceQueryKeys.all,
      'suggested-speakers',
      entity.entityType,
      entity.entityId,
      conferenceId ?? 'default',
    ] as const,
  conference: (entity: ConferenceEntity, conferenceId: string) =>
    [
      ...conferenceQueryKeys.byEntity(entity),
      'conference',
      conferenceId,
    ] as const,
};
