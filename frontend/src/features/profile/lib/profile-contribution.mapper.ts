import type { IdeaDashboardCard } from '@/features/ideas-dashboard/model/ideas-dashboard.types';
import type { ProblemDashboardCard } from '@/features/problems-dashboard/model/problems-dashboard.types';
import {
  isProfileIdea,
  isProfileProblem,
  type ProfileContribution,
} from '@/features/profile/model/profile-contributions.types';
import { formatUserDisplayName } from '@/shared/lib/user-display';

function toStageLabel(stage: string | null): string {
  if (!stage) return '';
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function toProfileContributionCard(
  item: ProfileContribution,
): IdeaDashboardCard | ProblemDashboardCard {
  const author = item.author ?? {
    id: '',
    email: '',
    firstName: null,
    lastName: null,
    avatarUrl: null,
  };

  const authorName = formatUserDisplayName(
    {
      firstName: author.firstName,
      lastName: author.lastName,
      email: author.email,
    },
    'Author',
  );

  const baseCard = {
    id: item.id,
    authorId: author.id,
    title: item.title?.trim() || 'Untitled',
    description: item.description?.trim() ?? '',
    imageUrl: item.mainImage?.url ?? null,
    authorName: authorName,
    authorAvatarUrl: author.avatarUrl ?? null,
    stage: toStageLabel(item.stage),
    stageValue: (item.stage?.toLowerCase() ??
      null) as IdeaDashboardCard['stageValue'],
    tags: item.tags?.map(t => t.name) ?? [],
    isLiked: item.isLiked ?? false,
    stats: {
      views: item.viewCount ?? 0,
      comments: item.commentCount ?? 0,
      likes: item.likeCount ?? 0,
    },
    linkedItems: [],
    publishedAt: item.publishedAt,
    status: item.status,
    isAuthor: item.viewer?.isAuthor ?? false,
  };

  if (isProfileIdea(item)) {
    return baseCard as IdeaDashboardCard;
  }

  if (isProfileProblem(item)) {
    return baseCard as ProblemDashboardCard;
  }

  throw new Error('Unsupported profile contribution item');
}
