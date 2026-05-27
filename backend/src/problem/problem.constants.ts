import { MediaKind, type Prisma } from '../../generated/prisma/client';

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
  members: true,
  ideas: {
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          status: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          author: {
            select: PROBLEM_FORM_AUTHOR_SELECT,
          },
          media: {
            where: { kind: MediaKind.MAIN_IMAGE },
            take: 1,
            orderBy: { sortOrder: 'asc' },
            select: { url: true },
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
} as const satisfies Prisma.ProblemInclude;
