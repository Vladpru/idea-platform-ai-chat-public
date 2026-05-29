import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import { formatUserDisplayName } from '@/shared/lib/user-display';
import { formStageToApiStage } from '@/features/ideas/lib/stages/stage-map';
import type { IdeaStage } from '@/features/ideas/lib/stages';
import type { ApiStage } from '@/features/ideas/model/idea.types';

import type { IdeaDashboardCard } from './ideas-dashboard.types';

function toStageLabel(stage: string | null): string {
  if (!stage) return '';
  const formStage = stage.toLowerCase() as IdeaStage;
  const apiStage = formStageToApiStage(formStage);
  return apiStage ?? stage.toUpperCase();
}

export function toIdeaDashboardCard(
  dto: IdeaFormResponseDto,
): IdeaDashboardCard {
  return {
    id: dto.id,
    authorId: dto.author.id,
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
    stageValue: (dto.stage?.toLowerCase() ?? null) as ApiStage | null,
    tags: dto.tags?.map(tag => tag.name) ?? [],
    isLiked: dto.isLiked ?? false,
    stats: {
      views: dto.viewCount ?? 0,
      comments: dto.commentCount ?? 0,
      likes: dto.likeCount ?? 0,
    },
    linkedItems:
      dto.problems?.map(problem => ({
        id: problem.id,
        title: problem.title,
        imageUrl: null,
        stats: {
          views: 0,
          comments: 0,
          likes: 0,
        },
      })) ?? [],
    publishedAt: dto.publishedAt,
    status: dto.status,
    isAuthor: dto.viewer?.isAuthor ?? false,
  };
}
