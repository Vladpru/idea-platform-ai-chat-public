export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  ideas: '/ideas',
  ideasNew: '/ideas/new',
  ideaDetail: (id: string) => `/ideas/${id}`,
  problems: '/problems',
  statistics: '/statistics',
  profile: '/profile',
  profileIdeas: '/profile/ideas',
  profileProblems: '/profile/problems',
  authCallback: '/auth/callback',
} as const;
