import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import { formatUserDisplayName } from '@/shared/lib/user-display';
import { formStageToApiStage } from '@/features/ideas/lib/stages/stage-map';
import type { IdeaStage } from '@/features/ideas/lib/stages';
import type { ApiStage } from '@/features/ideas/model/idea.types';

import type {
  IdeaDetails,
  IdeaDetailsAuthor,
  IdeaDetailsMember,
  IdeaDetailsTeamMember,
  SimilarIdeaCard,
} from './idea-details.types';

function toAuthor(author: IdeaFormResponseDto['author']): IdeaDetailsAuthor {
  return {
    id: author?.id ?? '',
    email: author?.email ?? '',
    firstName: author?.firstName ?? null,
    lastName: author?.lastName ?? null,
    avatarUrl: author?.avatarUrl ?? null,
  };
}

function toTeamMember(
  author: IdeaDetailsAuthor,
  fallbackName: string,
): IdeaDetailsTeamMember {
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

function toStageLabel(stage: string | null): string {
  if (!stage) {
    return '';
  }
  const formStage = stage.toLowerCase() as IdeaStage;
  const apiStage = formStageToApiStage(formStage);
  return apiStage ?? stage.toUpperCase();
}

function toProblemStageLabel(stage: string | null | undefined): string {
  if (!stage) {
    return '';
  }
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function toIdeaDetails(dto: IdeaFormResponseDto): IdeaDetails {
  const author = toAuthor(dto.author);
  const members: IdeaDetailsMember[] =
    dto.members?.map(member => ({
      user: toAuthor(member.user),
      joinedAt: member.joinedAt,
    })) ?? [];

  const authorTeamMember = toTeamMember(author, 'Author');
  const memberTeamMembers = members
    .filter(member => member.user.id !== author.id)
    .map(member => toTeamMember(member.user, 'Member'));

  const mainImage = dto.mainImage
    ? { id: dto.mainImage.id, url: dto.mainImage.url }
    : null;

  return {
    id: dto.id,
    authorId: author.id,
    status: dto.status,
    title: dto.title?.trim() ?? '',
    description: dto.description?.trim() ?? '',
    stage: toStageLabel(dto.stage),
    stageValue: (dto.stage?.toLowerCase() ?? null) as ApiStage | null,
    mainImage,
    mainImageUrl: mainImage?.url ?? null,
    tags: dto.tags?.map(tag => tag.name) ?? [],
    attachments:
      dto.attachments?.map(item => ({
        id: item.id,
        url: item.url,
        filename: item.originalFilename,
        mimeType: item.mimeType,
        byteSize: item.byteSize,
      })) ?? [],
    linkedProblems:
      dto.problems?.map(problem => ({
        id: problem.id,
        title: problem.title,
        description: problem.description,
        isPrimary: problem.isPrimary,
        status: problem.status,
        stage: toProblemStageLabel(problem.stage),
        authorName: formatUserDisplayName(
          {
            firstName: problem.author?.firstName,
            lastName: problem.author?.lastName,
            email: problem.author?.email,
          },
          'Author',
        ),
        authorAvatarUrl: problem.author?.avatarUrl ?? null,
        imageUrl: null,
        tags: [],
        stats: {
          views: problem.viewCount ?? 0,
          comments: problem.commentCount ?? 0,
          likes: problem.likeCount ?? 0,
        },
        isLiked: problem.isLiked ?? false,
      })) ?? [],
    author,
    members,
    viewer: {
      isAuthor: dto.viewer?.isAuthor ?? false,
      isMember: dto.viewer?.isMember ?? false,
      canJoin: dto.viewer?.canJoin ?? false,
    },
    team: [authorTeamMember, ...memberTeamMembers],
    createdAt: dto.publishedAt ?? new Date(0).toISOString(),
    isLiked: dto.isLiked ?? false,
    stats: {
      views: dto.viewCount ?? 0,
      comments: dto.commentCount ?? 0,
      likes: dto.likeCount ?? 0,
    },
    counts: {
      attachments: dto.attachments?.length ?? 0,
      discussion: dto.commentCount ?? 0,
      linkedProblems: dto.problems?.length ?? 0,
    },
  };
}

export function toSimilarIdeaCard(dto: IdeaFormResponseDto): SimilarIdeaCard {
  return {
    id: dto.id,
    title: dto.title?.trim() || 'Untitled idea',
    description: dto.description?.trim() ?? '',
    imageUrl: dto.mainImage?.url ?? null,
    authorName: formatUserDisplayName(
      {
        firstName: dto.author?.firstName,
        lastName: dto.author?.lastName,
        email: dto.author?.email,
      },
      'Author',
    ),
    authorAvatarUrl: dto.author?.avatarUrl ?? null,
    stage: toStageLabel(dto.stage),
    tags: dto.tags?.map(tag => tag.name) ?? [],
    stats: {
      views: dto.viewCount ?? 0,
      comments: dto.commentCount ?? 0,
      likes: dto.likeCount ?? 0,
    },
    isLiked: dto.isLiked ?? false,
  };
}
