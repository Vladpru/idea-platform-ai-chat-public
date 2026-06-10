import type {
  IdeaFormResponseDto,
  IdeaFormTagDto,
  IdeaMediaResponseDto,
} from '@/features/ideas/api/idea-form-api.types';
import type {
  ProblemForm,
  ProblemStatus,
  ProblemStage,
} from '@/features/problems/api/problems-api.types';

export type ProfileContributionKind = 'idea' | 'problem';
export type ProfileContributionsTab = 'all' | 'idea' | 'problem' | 'joined';

export type ProfileContributionAuthor = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type ProfileContributionViewer = {
  isAuthor: boolean;
  isMember: boolean;
  canJoin: boolean;
};

export type ProfileIdeaContribution = {
  kind: 'idea';
  id: string;
  status: IdeaFormResponseDto['status'];
  stage: string | null;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  tags: IdeaFormTagDto[];
  mainImage: IdeaMediaResponseDto | null;
  author: ProfileContributionAuthor;
  problems: IdeaFormResponseDto['problems'];
  viewer: ProfileContributionViewer;
};

export type ProfileProblemContribution = {
  kind: 'problem';
  id: string;
  status: ProblemStatus;
  stage: ProblemStage | null;
  title: string;
  description: string;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  tags: Array<{ id: string; name: string }>;
  mainImage: IdeaMediaResponseDto | null;
  author: ProfileContributionAuthor;
  ideas: ProblemForm['ideas'];
  viewer: ProfileContributionViewer;
};

export type ProfileContribution =
  | ProfileIdeaContribution
  | ProfileProblemContribution;

export type ProfileIdea = ProfileIdeaContribution;

export type ProfileProblem = ProfileProblemContribution;

export function isProfileIdea(
  item: ProfileContribution,
): item is ProfileIdeaContribution {
  return item.kind === 'idea';
}

export function isProfileProblem(
  item: ProfileContribution,
): item is ProfileProblemContribution {
  return item.kind === 'problem';
}

export type ProfileStatistics = {
  ideas: number;
  problems: number;
  totalViews: number;
  totalLikes: number;
};
