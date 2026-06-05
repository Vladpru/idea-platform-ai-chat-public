import type { ProblemForm } from '@/features/problems/api/problems-api.types';
import { formatUserDisplayName } from '@/shared/lib/user-display';

import type {
  ProblemDetails,
  ProblemDetailsAuthor,
  ProblemDetailsTeamMember,
  SimilarProblemCard,
} from './problem-details.types';

function toAuthor(author: ProblemForm['author']): ProblemDetailsAuthor {
  return {
    id: author?.id ?? '',
    email: author?.email ?? '',
    firstName: author?.firstName ?? null,
    lastName: author?.lastName ?? null,
    avatarUrl: author?.avatarUrl ?? null,
  };
}

function toTeamMember(
  author: ProblemDetailsAuthor,
  fallbackName: string,
): ProblemDetailsTeamMember {
  return {
    id: author.id,
    name: formatUserDisplayName(
      {
        firstName: author.firstName,
        lastName: author.lastName,
        email: author.email,
      },
      fallbackName,
    ),
    avatarUrl: author.avatarUrl,
  };
}

function toStageLabel(stage: ProblemForm['stage']): string {
  if (!stage) {
    return '';
  }
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function toProblemDetails(dto: ProblemForm): ProblemDetails {
  const author = toAuthor(dto.author);
  const authorTeamMember = toTeamMember(author, 'Author');

  const commentCount = dto.commentCount ?? 0;

  return {
    id: dto.id,
    commentCount,
    authorId: author.id,
    status: dto.status,
    title: dto.title?.trim() ?? '',
    description: dto.description?.trim() ?? '',
    aiSummary: dto.aiSummary,
    summaryStatus: dto.summaryStatus,
    valueProposition: dto.valueProposition?.trim() || null,
    costBenefit: dto.costBenefit,
    stage: toStageLabel(dto.stage),
    stageValue: dto.stage,
    tags: dto.tags?.map(tag => tag.name) ?? [],
    attachments:
      dto.attachments?.map(item => ({
        id: item.id,
        url: item.url,
        filename: item.originalFilename,
        mimeType: item.mimeType,
      })) ?? [],
    linkedIdeas:
      dto.ideas?.map(idea => ({
        id: idea.id,
        title: idea.title?.trim() || 'Untitled idea',
        isPrimary: idea.isPrimary,
        imageUrl: idea.imageUrl,
        stats: {
          views: idea.viewCount,
          comments: idea.commentCount,
          likes: idea.likeCount,
        },
      })) ?? [],
    author,
    viewer: {
      isAuthor: dto.viewer?.isAuthor ?? false,
      isMember: dto.viewer?.isMember ?? false,
      canJoin: dto.viewer?.canJoin ?? false,
    },
    team: [authorTeamMember],
    createdAt: dto.publishedAt ?? new Date(0).toISOString(),
    isLiked: dto.isLiked ?? false,
    stats: {
      views: dto.viewCount ?? 0,
      comments: commentCount,
      likes: dto.likeCount ?? 0,
    },
    counts: {
      attachments: dto.attachments?.length ?? 0,
      discussion: commentCount,
      linkedIdeas: dto.ideas?.length ?? 0,
    },
  };
}

export function toSimilarProblemCard(dto: ProblemForm): SimilarProblemCard {
  const author = toAuthor(dto.author);

  return {
    id: dto.id,
    title: dto.title?.trim() || 'Untitled problem',
    description: dto.description?.trim() ?? '',
    authorName: formatUserDisplayName(
      {
        firstName: author.firstName,
        lastName: author.lastName,
        email: author.email,
      },
      'Author',
    ),
    authorAvatarUrl: author.avatarUrl,
    stage: toStageLabel(dto.stage),
    tags: dto.tags?.map(tag => tag.name) ?? [],
    stats: {
      views: dto.viewCount ?? 0,
      comments: dto.commentCount ?? 0,
      likes: dto.likeCount ?? 0,
    },
  };
}
