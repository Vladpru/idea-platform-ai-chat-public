import { MediaKind, Prisma } from '../../../generated/prisma/client';

export const PROBLEM_FORM_AUTHOR_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

export const PROBLEM_FORM_MEMBER_INCLUDE = {
  user: {
    select: PROBLEM_FORM_AUTHOR_SELECT,
  },
} as const satisfies Prisma.ProblemMemberInclude;

export const PROBLEM_COMMENT_COUNT_SELECT = {
  _count: {
    select: { comments: true },
  },
} as const satisfies Pick<Prisma.ProblemInclude, '_count'>;

export const PROBLEM_FORM_INCLUDE = {
  ...PROBLEM_COMMENT_COUNT_SELECT,
  author: {
    select: PROBLEM_FORM_AUTHOR_SELECT,
  },
  members: {
    include: PROBLEM_FORM_MEMBER_INCLUDE,
  },
  ideas: {
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
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

export function problemFormInclude(currentUserId: string) {
  return {
    ...PROBLEM_COMMENT_COUNT_SELECT,
    author: PROBLEM_FORM_INCLUDE.author,
    members: PROBLEM_FORM_INCLUDE.members,
    ideas: PROBLEM_FORM_INCLUDE.ideas,
    tags: PROBLEM_FORM_INCLUDE.tags,
    media: PROBLEM_FORM_INCLUDE.media,
    likes: {
      where: { userId: currentUserId },
      select: { userId: true },
    },
  } as const satisfies Prisma.ProblemInclude;
}

export function resolveProblemFormInclude(
  userId?: string,
): Prisma.ProblemInclude {
  if (!userId) {
    return PROBLEM_FORM_INCLUDE;
  }

  return problemFormInclude(userId);
}
