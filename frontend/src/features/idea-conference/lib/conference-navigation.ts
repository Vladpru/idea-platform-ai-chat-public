import { ROUTES } from '@/shared/config/paths';

export function getIdeaConferencePath(
  ideaId: string,
  conferenceId: string,
): string {
  return ROUTES.ideaConference(ideaId, conferenceId);
}
