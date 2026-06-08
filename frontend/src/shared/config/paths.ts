export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  ideas: '/ideas',
  ideasNew: '/ideas/new',
  ideaCreation: (id: string) => `/ideas/new?ideaId=${encodeURIComponent(id)}`,
  ideaDetail: (id: string) => `/ideas/${id}`,
  ideaDiscussionReply: (id: string, commentId: string) =>
    `/ideas/${id}?tab=discussion&replyTo=${encodeURIComponent(commentId)}`,
  problems: '/problems',
  problemsNew: '/problems/new',
  problemCreation: (id: string) =>
    `/problems/new?problemId=${encodeURIComponent(id)}`,
  problemDetail: (id: string) => `/problems/${id}`,
  problemDiscussionReply: (id: string, commentId: string) =>
    `/problems/${id}?tab=discussion&replyTo=${encodeURIComponent(commentId)}`,
  search: '/search',
  statistics: '/statistics',
  profile: '/profile',
  settings: '/settings',
  settingsNotifications: '/settings/notifications',
  profileIdeas: '/profile/ideas',
  profileProblems: '/profile/problems',
  authCallback: '/auth/callback',
} as const;
