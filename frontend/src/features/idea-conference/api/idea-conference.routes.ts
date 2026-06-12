export const IDEA_CONFERENCE_ROUTES = {
  conferences: (ideaId: string) => `/ideas/${ideaId}/conferences`,
  suggestedSpeakers: (ideaId: string) =>
    `/ideas/${ideaId}/conferences/suggested-speakers`,
  conference: (ideaId: string, conferenceId: string) =>
    `/ideas/${ideaId}/conferences/${conferenceId}`,
  invites: (ideaId: string, conferenceId: string) =>
    `/ideas/${ideaId}/conferences/${conferenceId}/invites`,
  join: (ideaId: string, conferenceId: string) =>
    `/ideas/${ideaId}/conferences/${conferenceId}/join`,
} as const;
