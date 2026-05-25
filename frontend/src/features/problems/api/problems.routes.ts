export const PROBLEMS_ROUTES = {
  root: '/problems',
  mine: '/problems/mine',
  byId: (problemId: string) => `/problems/${problemId}`,
  media: (problemId: string) => `/problems/${problemId}/media`,
  mediaById: (problemId: string, mediaId: string) =>
    `/problems/${problemId}/media/${mediaId}`,
} as const;
