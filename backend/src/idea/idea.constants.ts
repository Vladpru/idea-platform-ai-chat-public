import { Prisma } from '../../generated/prisma/client';

export const IDEA_FORM_AUTHOR_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

export const IDEA_FORM_MEMBER_INCLUDE = {
  user: {
    select: IDEA_FORM_AUTHOR_SELECT,
  },
} as const satisfies Prisma.IdeaMemberInclude;

const IDEA_FORM_PROBLEM_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  stage: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  author: {
    select: IDEA_FORM_AUTHOR_SELECT,
  },
} as const satisfies Prisma.ProblemSelect;

export function userLikesInclude(userId: string) {
  return {
    where: { userId },
    select: { userId: true },
  } as const;
}

export const IDEA_FORM_INCLUDE = {
  author: {
    select: IDEA_FORM_AUTHOR_SELECT,
  },
  problems: {
    include: {
      problem: {
        select: IDEA_FORM_PROBLEM_SELECT,
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
  members: {
    include: IDEA_FORM_MEMBER_INCLUDE,
  },
  media: true,
  _count: {
    select: { comments: true },
  },
} as const satisfies Prisma.IdeaInclude;

export function ideaFormInclude(currentUserId: string) {
  const likes = userLikesInclude(currentUserId);

  return {
    author: IDEA_FORM_INCLUDE.author,
    problems: {
      include: {
        problem: {
          select: {
            ...IDEA_FORM_PROBLEM_SELECT,
            likes,
          },
        },
      },
    },
    tags: IDEA_FORM_INCLUDE.tags,
    members: IDEA_FORM_INCLUDE.members,
    media: IDEA_FORM_INCLUDE.media,
    likes,
    _count: {
      select: { comments: true },
    },
  } as const satisfies Prisma.IdeaInclude;
}

export function resolveIdeaFormInclude(userId?: string): Prisma.IdeaInclude {
  if (!userId) {
    return IDEA_FORM_INCLUDE;
  }

  return ideaFormInclude(userId);
}
