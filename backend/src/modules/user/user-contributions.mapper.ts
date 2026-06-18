import { MediaKind, type Prisma } from '../../../generated/prisma/client';
import { IDEA_FORM_AUTHOR_SELECT } from '../idea/idea.constants';
import { toIdeaAuthorResponse, toIdeaMediaResponse } from '../idea/idea.mapper';
import { PROBLEM_FORM_AUTHOR_SELECT } from '../problem/problem.constants';
import {
  toProblemAuthorResponse,
  toProblemMediaResponse,
} from '../problem/problem.mapper';
import type {
  UserContributionAuthor,
  UserContributionIdeaItem,
  UserContributionProblemItem,
} from './types/user-contributions.types';

type ContributionAuthorSource = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

function resolveContributionAuthor(
  relationAuthor: ContributionAuthorSource | null | undefined,
  fallbackAuthor: ContributionAuthorSource,
): UserContributionAuthor {
  const source = relationAuthor ?? fallbackAuthor;

  return {
    id: source.id,
    email: source.email,
    firstName: source.firstName,
    lastName: source.lastName,
    avatarUrl: source.avatarUrl,
  };
}

export const CONTRIBUTION_IDEA_INCLUDE = {
  author: {
    select: IDEA_FORM_AUTHOR_SELECT,
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
  media: {
    where: { kind: MediaKind.MAIN_IMAGE },
    orderBy: { sortOrder: 'asc' },
  },
  _count: {
    select: {
      views: true,
      likes: true,
      comments: true,
    },
  },
} as const satisfies Prisma.IdeaInclude;

export const CONTRIBUTION_PROBLEM_INCLUDE = {
  author: {
    select: PROBLEM_FORM_AUTHOR_SELECT,
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
  media: {
    where: { kind: MediaKind.MAIN_IMAGE },
    orderBy: { sortOrder: 'asc' },
  },
  _count: {
    select: {
      views: true,
      likes: true,
      comments: true,
    },
  },
} as const satisfies Prisma.ProblemInclude;

export function resolveContributionIdeaInclude(
  currentUserId?: string,
): Prisma.IdeaInclude {
  const include: Prisma.IdeaInclude = {
    author: CONTRIBUTION_IDEA_INCLUDE.author,
    tags: CONTRIBUTION_IDEA_INCLUDE.tags,
    media: CONTRIBUTION_IDEA_INCLUDE.media,
    _count: CONTRIBUTION_IDEA_INCLUDE._count,
  };

  if (currentUserId) {
    include.likes = {
      where: { userId: currentUserId },
      select: { userId: true },
    };
  }

  return include;
}

export function resolveContributionProblemInclude(
  currentUserId?: string,
): Prisma.ProblemInclude {
  const include: Prisma.ProblemInclude = {
    author: CONTRIBUTION_PROBLEM_INCLUDE.author,
    tags: CONTRIBUTION_PROBLEM_INCLUDE.tags,
    media: CONTRIBUTION_PROBLEM_INCLUDE.media,
    _count: CONTRIBUTION_PROBLEM_INCLUDE._count,
  };

  if (currentUserId) {
    include.likes = {
      where: { userId: currentUserId },
      select: { userId: true },
    };
  }

  return include;
}

export type HydratedContributionIdea = Prisma.IdeaGetPayload<{
  include: typeof CONTRIBUTION_IDEA_INCLUDE;
}> & {
  likes?: Array<{ userId: string }>;
};

export type HydratedContributionProblem = Prisma.ProblemGetPayload<{
  include: typeof CONTRIBUTION_PROBLEM_INCLUDE;
}> & {
  likes?: Array<{ userId: string }>;
};

export function toUserContributionIdeaItem(
  idea: HydratedContributionIdea,
  fallbackAuthor: ContributionAuthorSource,
  currentUserId?: string,
): UserContributionIdeaItem {
  const mainImageRecord = idea.media?.[0] ?? null;
  const author = resolveContributionAuthor(idea.author, fallbackAuthor);
  const isAuthor = currentUserId ? author.id === currentUserId : false;

  return {
    kind: 'idea',
    id: idea.id,
    status: idea.status,
    stage: idea.stage,
    title: idea.title,
    description: idea.description,
    publishedAt: idea.publishedAt?.toISOString() ?? null,
    viewCount: idea._count?.views ?? 0,
    likeCount: idea._count?.likes ?? 0,
    commentCount: idea._count?.comments ?? 0,
    isLiked: (idea.likes?.length ?? 0) > 0,
    tags: (idea.tags ?? []).map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
    })),
    mainImage: mainImageRecord ? toIdeaMediaResponse(mainImageRecord) : null,
    author: toIdeaAuthorResponse(author),
    problems: [],
    viewer: {
      isAuthor,
      isMember: false,
      canJoin: false,
    },
  };
}

export function toUserContributionProblemItem(
  problem: HydratedContributionProblem,
  fallbackAuthor: ContributionAuthorSource,
  currentUserId?: string,
): UserContributionProblemItem {
  const mainImageRecord = problem.media?.[0] ?? null;
  const author = resolveContributionAuthor(problem.author, fallbackAuthor);
  const isAuthor = currentUserId ? author.id === currentUserId : false;

  return {
    kind: 'problem',
    id: problem.id,
    status: problem.status,
    stage: problem.stage,
    title: problem.title,
    description: problem.description,
    publishedAt: problem.publishedAt?.toISOString() ?? null,
    viewCount: problem._count?.views ?? 0,
    likeCount: problem._count?.likes ?? 0,
    commentCount: problem._count?.comments ?? 0,
    isLiked: (problem.likes?.length ?? 0) > 0,
    tags: (problem.tags ?? []).map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
    })),
    mainImage: mainImageRecord ? toProblemMediaResponse(mainImageRecord) : null,
    author: toProblemAuthorResponse(author),
    ideas: [],
    viewer: {
      isAuthor,
      isMember: false,
      canJoin: false,
    },
  };
}
