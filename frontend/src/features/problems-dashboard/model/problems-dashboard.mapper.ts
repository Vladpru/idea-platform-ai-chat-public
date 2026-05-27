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

function pickProblemImageUrl(dto: ProblemForm): string | null {
  const imageAttachment = dto.attachments.find(attachment =>
    attachment.mimeType.startsWith('image/'),
  );
  return imageAttachment?.url ?? null;
}

export function toProblemDashboardCard(dto: ProblemForm): ProblemDashboardCard {
  return {
    id: dto.id,
    title: dto.title?.trim() || 'Untitled problem',
    description: dto.description?.trim() ?? '',
    imageUrl: pickProblemImageUrl(dto),
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
    stats: {
      views: 0,
      comments: 0,
      likes: 0,
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
  };
}
