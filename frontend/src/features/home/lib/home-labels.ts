export const HOME_LABELS = {
  pageTitle: 'Home',
  welcome: (name: string) => `Welcome back, ${name}`,
  subtitle:
    'Explore problems, share ideas, and track platform activity — all in one place.',
  quickActionsTitle: 'Quick actions',
  yourActivityTitle: 'Your activity',
  platformActivityTitle: 'Platform activity this week',
  viewStatistics: 'View full statistics',
  ideasCardTitle: 'My ideas',
  problemsCardTitle: 'My problems',
  published: 'Published',
  drafts: 'Drafts',
  joined: 'Joined',
  loadError: 'Some dashboard data could not be loaded.',
  tryAgain: 'Try again',
  quickLinks: {
    problems: {
      title: 'Browse problems',
      description: 'Discover challenges shared by the community.',
    },
    ideas: {
      title: 'Browse ideas',
      description: 'Explore solutions and creative proposals.',
    },
    addProblem: {
      title: 'Add new problem',
      description: 'Submit a problem for others to solve.',
    },
    addIdea: {
      title: 'Add new idea',
      description: 'Share your solution or concept.',
    },
    search: {
      title: 'Search',
      description: 'Find problems and ideas across the platform.',
    },
    statistics: {
      title: 'Statistics',
      description: 'Review trends, contributors, and activity.',
    },
  },
} as const;
