import type { Prisma } from '../../generated/prisma/client';

export const PROBLEM_FORM_AUTHOR_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

export const PROBLEM_FORM_INCLUDE = {
  author: {
    select: PROBLEM_FORM_AUTHOR_SELECT,
  },
  ideas: {
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          status: true,
          author: {
            select: PROBLEM_FORM_AUTHOR_SELECT,
          },
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
} satisfies Prisma.ProblemInclude;
