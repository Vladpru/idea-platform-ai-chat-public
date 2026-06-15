export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  ideas: '/ideas',
  ideasNew: '/ideas/new',
  ideaCreation: (id: string) => `/ideas/new?ideaId=${encodeURIComponent(id)}`,
  ideaDetail: (id: string) => `/ideas/${id}`,
  ideaConference: (ideaId: string, conferenceId: string) =>
    `/ideas/${ideaId}/conferences/${conferenceId}`,
  ideaDiscussionReply: (id: string, commentId: string) =>
    `/ideas/${id}?tab=discussion&replyTo=${encodeURIComponent(commentId)}`,
  problems: '/problems',
  problemsNew: '/problems/new',
  problemCreation: (id: string) =>
    `/problems/new?problemId=${encodeURIComponent(id)}`,
  problemDetail: (id: string) => `/problems/${id}`,
  problemConference: (problemId: string, conferenceId: string) =>
    `/problems/${problemId}/conferences/${conferenceId}`,
  problemDiscussionReply: (id: string, commentId: string) =>
    `/problems/${id}?tab=discussion&replyTo=${encodeURIComponent(commentId)}`,
  search: '/search',
  statistics: '/statistics',
  statisticsLeaderboard: '/statistic/leaderboard',
  profile: '/profile',
  profileById: (id: string) => `/profile/${id}`,
  settings: '/settings',
  settingsNotifications: '/settings/notifications',
  profileIdeas: '/profile/ideas',
  profileProblems: '/profile/problems',
  liveChats: '/live-chats',
  liveChatRoom: (id: string) => `/live-chats/${id}`,
  authCallback: '/auth/callback',
} as const;
