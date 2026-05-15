/** App URL segments (see `routes/` for TanStack route files, `pages/` for screen UI). */
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  ideas: '/ideas',
  problems: '/problems',
  statistics: '/statistics',
  profile: '/profile',
  profileIdeas: '/profile/ideas',
  profileProblems: '/profile/problems',
  authCallback: '/auth/callback',
} as const;
