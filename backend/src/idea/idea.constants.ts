export const IDEA_FORM_INCLUDE = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  problems: {
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
        },
      },
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  media: true,
} as const;
