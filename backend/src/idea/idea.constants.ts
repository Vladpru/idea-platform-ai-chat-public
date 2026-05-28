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

export type IdeaFormMemberRecord = Prisma.IdeaMemberGetPayload<{
  include: typeof IDEA_FORM_MEMBER_INCLUDE;
}>;

export const IDEA_FORM_INCLUDE = {
  author: {
    select: IDEA_FORM_AUTHOR_SELECT,
  },
  problems: {
    include: {
      problem: {
        select: {
          id: true,
          title: true,
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
  members: {
    include: IDEA_FORM_MEMBER_INCLUDE,
  },
  media: true,
} as const satisfies Prisma.IdeaInclude;

export function ideaFormInclude(currentUserId: string) {
  return {
    author: IDEA_FORM_INCLUDE.author,
    problems: IDEA_FORM_INCLUDE.problems,
    tags: IDEA_FORM_INCLUDE.tags,
    members: IDEA_FORM_INCLUDE.members,
    media: IDEA_FORM_INCLUDE.media,
    likes: {
      where: { userId: currentUserId },
      select: { userId: true },
    },
  } as const satisfies Prisma.IdeaInclude;
}

export function resolveIdeaFormInclude(userId?: string): Prisma.IdeaInclude {
  if (!userId) {
    return IDEA_FORM_INCLUDE;
  }

  return ideaFormInclude(userId);
}
