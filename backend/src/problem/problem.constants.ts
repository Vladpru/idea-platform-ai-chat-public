import type { Prisma } from '../../generated/prisma/client';

export const PROBLEM_FORM_INCLUDE = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  ideas: {
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          status: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
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
