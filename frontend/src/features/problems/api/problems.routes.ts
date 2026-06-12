export const PROBLEMS_ROUTES = {
  root: '/problems',
  suggestedIdeas: '/problems/suggested-ideas',
  myDashboard: '/problems/my-dashboard',
  byId: (problemId: string) => `/problems/${problemId}`,
  media: (problemId: string) => `/problems/${problemId}/media`,
  mediaById: (problemId: string, mediaId: string) =>
    `/problems/${problemId}/media/${mediaId}`,
  join: (problemId: string) => `/problems/${problemId}/join`,
  leave: (problemId: string) => `/problems/${problemId}/leave`,
} as const;
