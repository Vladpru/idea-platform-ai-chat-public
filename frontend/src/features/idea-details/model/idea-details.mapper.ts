import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import { formatPersonName } from '@/features/idea-details/lib/format-person-name';
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
    name: formatPersonName(author.firstName, author.lastName, fallbackName),
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
        authorName: formatPersonName(
          problem.author?.firstName ?? null,
          problem.author?.lastName ?? null,
          'Author',
        ),
        authorAvatarUrl: problem.author?.avatarUrl ?? null,
        imageUrl: null,
        tags: [],
        stats: {
          views: 0,
          comments: 0,
          likes: 0,
        },
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
    stats: {
      views: 0,
      comments: 0,
      likes: 0,
    },
    counts: {
      attachments: dto.attachments?.length ?? 0,
      discussion: 0,
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
    authorName: formatPersonName(
      dto.author?.firstName ?? null,
      dto.author?.lastName ?? null,
      'Author',
    ),
    authorAvatarUrl: dto.author?.avatarUrl ?? null,
    stage: toStageLabel(dto.stage),
    tags: dto.tags?.map(tag => tag.name) ?? [],
    stats: {
      views: 0,
      comments: 0,
      likes: 0,
    },
  };
}
