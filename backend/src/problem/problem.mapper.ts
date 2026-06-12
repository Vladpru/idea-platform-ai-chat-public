import type {
  ProblemFormAuthor,
  ProblemFormMember,
  ProblemFormRecord,
  ProblemFormResponse,
  ProblemFormTag,
  ProblemLinkedIdea,
  ProblemMediaResponse,
} from './types/problem-form.types';

export type { ProblemFormRecord } from './types/problem-form.types';

type ProblemMediaInput = {
  id: string;
  kind: ProblemMediaResponse['kind'];
  provider: ProblemMediaResponse['provider'];
  url: string;
  mimeType: string;
  byteSize: number;
  originalFilename: string;
  sortOrder: number;
  createdAt: Date;
};

type ProblemTagLinkInput = {
  tag: ProblemFormTag;
};

const ATTACHMENT: ProblemMediaResponse['kind'] = 'ATTACHMENT';

export function toProblemMediaResponse(
  media: ProblemMediaInput,
): ProblemMediaResponse {
  return {
    id: media.id,
    kind: media.kind,
    provider: media.provider,
    url: media.url,
    mimeType: media.mimeType,
    byteSize: media.byteSize,
    originalFilename: media.originalFilename,
    sortOrder: media.sortOrder,
    createdAt: media.createdAt.toISOString(),
  };
}

export function toProblemAuthorResponse(
  author: ProblemFormAuthor,
): ProblemFormAuthor {
  return {
    id: author.id,
    email: author.email,
    firstName: author.firstName,
    lastName: author.lastName,
    avatarUrl: author.avatarUrl,
  };
}

function toProblemLinkedIdea(
  link: ProblemFormRecord['ideas'][number],
): ProblemLinkedIdea {
  return {
    id: link.idea.id,
    title: link.idea.title,
    isPrimary: link.isPrimary,
    imageUrl: link.idea.media[0]?.url ?? null,
    viewCount: link.idea.viewCount ?? 0,
    likeCount: link.idea.likeCount ?? 0,
    commentCount: link.idea.commentCount ?? 0,
  };
}

function resolveProblemCommentCount(problem: ProblemFormRecord): number {
  return problem._count?.comments ?? problem.commentCount ?? 0;
}

function mapProblemEngagementMetrics(problem: ProblemFormRecord) {
  return {
    viewCount: problem.viewCount ?? 0,
    likeCount: problem.likeCount ?? 0,
    commentCount: resolveProblemCommentCount(problem),
    isLiked: Boolean(problem.likes && problem.likes.length > 0),
  };
}

function toProblemFormTag(link: ProblemTagLinkInput): ProblemFormTag {
  return {
    id: link.tag.id,
    name: link.tag.name,
  };
}

export function toProblemFormResponse(
  problem: ProblemFormRecord,
  currentUserId?: string,
): ProblemFormResponse {
  const attachments = problem.media
    .filter(m => m.kind === ATTACHMENT)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const isAuthor = currentUserId ? problem.author.id === currentUserId : false;
  const isMember = currentUserId
    ? problem.members.some(m => m.userId === currentUserId)
    : false;

  return {
    id: problem.id,
    status: problem.status,
    stage: problem.stage,
    title: problem.title,
    description: problem.description,
    valueProposition: problem.valueProposition,
    costBenefit: problem.costBenefit?.toString() ?? null,
    category: problem.category,
    impact: problem.impact,
    aiSummary: problem.aiSummary,
    summaryStatus: problem.summaryStatus,
    publishedAt: problem.publishedAt?.toISOString() ?? null,
    ...mapProblemEngagementMetrics(problem),
    ideas: problem.ideas.map(toProblemLinkedIdea),
    tags: problem.tags.map(toProblemFormTag),
    attachments: attachments.map(toProblemMediaResponse),
    author: toProblemAuthorResponse(problem.author),
    members: problem.members.map(
      (m): ProblemFormMember => ({
        user: toProblemAuthorResponse(m.user),
        joinedAt: m.joinedAt.toISOString(),
      }),
    ),
    viewer: {
      isAuthor,
      isMember,
      canJoin:
        !!currentUserId &&
        !isAuthor &&
        !isMember &&
        problem.status === 'PUBLISHED',
    },
  };
}
