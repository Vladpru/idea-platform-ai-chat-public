import type {
  ProblemForm,
  ProblemStage,
} from '@/features/problems/api/problems-api.types';

import { formatUserDisplayName } from '@/shared/lib/user-display';

import type { ProblemDashboardCard } from './problems-dashboard.types';

function toStageLabel(stage: ProblemStage | null): string {
  if (!stage) return '';
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function toProblemDashboardCard(dto: ProblemForm): ProblemDashboardCard {
  return {
    id: dto.id,
    authorId:
      dto.author?.id ?? (dto as unknown as { authorId: string }).authorId ?? '',
    title: dto.title?.trim() || 'Untitled problem',
    description: dto.description?.trim() ?? '',
    imageUrl: null,
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
    stageValue: dto.stage,
    tags: dto.tags?.map(tag => tag.name) ?? [],
    isLiked: dto.isLiked ?? false,
    stats: {
      views: dto.viewCount ?? 0,
      comments: dto.commentCount ?? 0,
      likes: dto.likeCount ?? 0,
    },
    linkedItems:
      dto.ideas?.map(idea => ({
        id: idea.id,
        title: idea.title?.trim() || 'Untitled idea',
        imageUrl: idea.imageUrl,
        stats: {
          views: idea.viewCount,
          comments: idea.commentCount,
          likes: idea.likeCount,
        },
      })) ?? [],
    publishedAt: dto.publishedAt,
    status: dto.status,
    isAuthor: dto.viewer?.isAuthor ?? false,
  };
}
