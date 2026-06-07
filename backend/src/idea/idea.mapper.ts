import { MediaKind } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { IDEA_FORM_INCLUDE } from './idea.constants';
import type {
  IdeaFormAuthor,
  IdeaFormMember,
  IdeaFormResponseWithProblem,
  IdeaMediaResponse,
} from './types/idea-form.types';

type UserLikeRecord = { userId: string };

type IdeaFormProblemRecord = {
  id: string;
  title: string | null;
  description: string | null;
  status: string;
  stage: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  author: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  likes?: UserLikeRecord[];
};

export type IdeaFormRecord = Prisma.IdeaGetPayload<{
  include: typeof IDEA_FORM_INCLUDE;
}> & {
  likes?: UserLikeRecord[];
  problems: Array<{
    isPrimary: boolean;
    problem: IdeaFormProblemRecord;
  }>;
};

function mapUserIsLiked(likes: UserLikeRecord[] | undefined): boolean {
  return (likes?.length ?? 0) > 0;
}

function resolveIdeaCommentCount(idea: IdeaFormRecord): number {
  return idea._count?.comments ?? idea.commentCount ?? 0;
}

function mapIdeaEngagementMetrics(idea: IdeaFormRecord) {
  return {
    viewCount: idea.viewCount ?? 0,
    likeCount: idea.likeCount ?? 0,
    commentCount: resolveIdeaCommentCount(idea),
    isLiked: mapUserIsLiked(idea.likes),
  };
}

export function toIdeaAuthorResponse(author: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}): IdeaFormAuthor {
  return {
    id: author.id,
    email: author.email,
    firstName: author.firstName,
    lastName: author.lastName,
    avatarUrl: author.avatarUrl,
  };
}

export function toIdeaMediaResponse(
  media: IdeaFormRecord['media'][number],
): IdeaMediaResponse {
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

export function toIdeaFormResponse(
  idea: IdeaFormRecord,
  currentUserId?: string,
): IdeaFormResponseWithProblem {
  const mainImages = idea.media.filter(m => m.kind === MediaKind.MAIN_IMAGE);
  const mainImage = mainImages[0] ?? null;
  const attachments = idea.media
    .filter(m => m.kind === MediaKind.ATTACHMENT)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const isAuthor = currentUserId ? idea.authorId === currentUserId : false;

  const isMember = currentUserId
    ? idea.members.some(m => m.userId === currentUserId)
    : false;

  return {
    id: idea.id,
    status: idea.status,
    stage: idea.stage,
    title: idea.title,
    description: idea.description,
    aiSummary: idea.aiSummary,
    summaryStatus: idea.summaryStatus,
    publishedAt: idea.publishedAt?.toISOString() ?? null,
    ...mapIdeaEngagementMetrics(idea),
    viewer: {
      isAuthor,
      isMember,
      canJoin:
        !!currentUserId &&
        !isAuthor &&
        !isMember &&
        idea.status === 'PUBLISHED',
    },
    problems: idea.problems.map(({ problem, isPrimary }) => {
      const problemRecord = problem as IdeaFormProblemRecord;

      return {
        id: problemRecord.id,
        title: problemRecord.title ?? '',
        description: problemRecord.description ?? '',
        status: problemRecord.status,
        stage: problemRecord.stage,
        isPrimary,
        author: toIdeaAuthorResponse(problemRecord.author),
        viewCount: problemRecord.viewCount ?? 0,
        likeCount: problemRecord.likeCount ?? 0,
        commentCount: problemRecord.commentCount ?? 0,
        isLiked: mapUserIsLiked(problemRecord.likes),
      };
    }),
    tags: idea.tags.map(({ tag }) => ({
      id: tag.id,
      name: tag.name,
    })),
    mainImage: mainImage ? toIdeaMediaResponse(mainImage) : null,
    attachments: attachments.map(toIdeaMediaResponse),
    author: toIdeaAuthorResponse(idea.author),
    members: idea.members.map(
      (m): IdeaFormMember => ({
        user: toIdeaAuthorResponse(m.user),
        joinedAt: m.joinedAt.toISOString(),
      }),
    ),
  };
}
