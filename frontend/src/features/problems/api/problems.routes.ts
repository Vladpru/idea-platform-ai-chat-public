export const PROBLEMS_ROUTES = {
  root: '/problems',
  suggestedIdeas: '/problems/suggested-ideas',
  myDashboard: '/problems/my-dashboard',
  byId: (problemId: string) => `/problems/${problemId}`,
  media: (problemId: string) => `/problems/${problemId}/media`,
  mediaById: (problemId: string, mediaId: string) =>
    `/problems/${problemId}/media/${mediaId}`,
} as const;
