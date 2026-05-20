export const IDEAS_ROUTES = {
  root: '/ideas',
  byId: (ideaId: string) => `/ideas/${ideaId}`,
  publish: (ideaId: string) => `/ideas/${ideaId}/publish`,
  mainImage: (ideaId: string) => `/ideas/${ideaId}/main-image`,
  media: (ideaId: string) => `/ideas/${ideaId}/media`,
  mediaById: (ideaId: string, mediaId: string) =>
    `/ideas/${ideaId}/media/${mediaId}`,
} as const;
