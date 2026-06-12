import type { IdeaConferenceDto } from '@/features/idea-conference/api/idea-conference-api.types';

export type FeaturedConference =
  | { kind: 'live'; conference: IdeaConferenceDto }
  | { kind: 'scheduled'; conference: IdeaConferenceDto }
  | null;

export function resolveFeaturedConference(
  conferences: IdeaConferenceDto[],
): FeaturedConference {
  const active = conferences.filter(
    c => c.status === 'LIVE' || c.status === 'SCHEDULED',
  );

  const liveConference = active.find(c => c.status === 'LIVE');

  if (liveConference) {
    return { kind: 'live', conference: liveConference };
  }

  const upcomingConference = active
    .filter(c => c.status === 'SCHEDULED')
    .sort(
      (left, right) =>
        new Date(left.scheduledFor).getTime() -
        new Date(right.scheduledFor).getTime(),
    )[0];

  if (upcomingConference) {
    return { kind: 'scheduled', conference: upcomingConference };
  }

  return null;
}
