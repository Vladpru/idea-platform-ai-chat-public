export const ideaConferenceQueryKeys = {
  all: ['idea-conferences'] as const,
  byIdea: (ideaId: string) =>
    [...ideaConferenceQueryKeys.all, 'idea', ideaId] as const,
  suggestedSpeakers: (ideaId: string, conferenceId?: string) =>
    [
      ...ideaConferenceQueryKeys.all,
      'suggested-speakers',
      ideaId,
      conferenceId ?? 'default',
    ] as const,
  conference: (ideaId: string, conferenceId: string) =>
    [
      ...ideaConferenceQueryKeys.byIdea(ideaId),
      'conference',
      conferenceId,
    ] as const,
};
