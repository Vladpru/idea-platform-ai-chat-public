export const IDEAS_ROUTES = {
  root: '/ideas',
  myDashboard: '/ideas/my-dashboard',
  prefill: '/ideas/prefill',

  byId: (ideaId: string) => `/ideas/${ideaId}`,
  publish: (ideaId: string) => `/ideas/${ideaId}/publish`,
  mainImage: (ideaId: string) => `/ideas/${ideaId}/main-image`,
  media: (ideaId: string) => `/ideas/${ideaId}/media`,
  mediaById: (ideaId: string, mediaId: string) =>
    `/ideas/${ideaId}/media/${mediaId}`,
  join: (ideaId: string) => `/ideas/${ideaId}/join`,
  leave: (ideaId: string) => `/ideas/${ideaId}/leave`,
  exportPdf: (ideaId: string) => `/ideas/${ideaId}/export-pdf`,
} as const;
