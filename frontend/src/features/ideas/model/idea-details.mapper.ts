import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import { formStageToApiStage } from '@/features/ideas/lib/stages/stage-map';
import type { IdeaStage } from '@/features/ideas/lib/stages';
import type { ApiStage } from '@/features/ideas/model/idea.types';

import type { IdeaDetails, SimilarIdeaCard } from './idea-details.types';

function formatPersonName(
  firstName: string | null,
  lastName: string | null,
  fallback: string,
): string {
  const full = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return full || fallback;
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
  const authorName = formatPersonName(
    dto.author.firstName,
    dto.author.lastName,
    'Author',
  );

  const mainImage = dto.mainImage
    ? { id: dto.mainImage.id, url: dto.mainImage.url }
    : null;

  return {
    id: dto.id,
    authorId: dto.author.id,
    status: dto.status,
    title: dto.title?.trim() ?? '',
    description: dto.description?.trim() ?? '',
    stage: toStageLabel(dto.stage),
    stageValue: (dto.stage?.toLowerCase() ?? null) as ApiStage | null,
    mainImage,
    mainImageUrl: mainImage?.url ?? null,
    tags: dto.tags.map(tag => tag.name),
    attachments: dto.attachments.map(item => ({
      id: item.id,
      url: item.url,
      filename: item.originalFilename,
      mimeType: item.mimeType,
      byteSize: item.byteSize,
    })),
    linkedProblems: dto.problems.map(problem => ({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      isPrimary: problem.isPrimary,
      status: problem.status,
      authorName: formatPersonName(
        problem.author.firstName,
        problem.author.lastName,
        'Author',
      ),
      authorAvatarUrl: problem.author.avatarUrl,
      imageUrl: null,
      tags: [],
      stats: {
        views: 0,
        comments: 0,
        likes: 0,
      },
    })),
    team: [
      {
        id: dto.author.id,
        name: authorName,
        avatarUrl: dto.author.avatarUrl,
      },
    ],
    createdAt: dto.publishedAt ?? new Date(0).toISOString(),
    stats: {
      views: 0,
      comments: 0,
      likes: 0,
    },
    counts: {
      attachments: dto.attachments.length,
      discussion: 0,
      linkedProblems: dto.problems.length,
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
      dto.author.firstName,
      dto.author.lastName,
      'Author',
    ),
    authorAvatarUrl: dto.author.avatarUrl,
    stage: toStageLabel(dto.stage),
    tags: dto.tags.map(tag => tag.name),
    stats: {
      views: 0,
      comments: 0,
      likes: 0,
    },
  };
}
