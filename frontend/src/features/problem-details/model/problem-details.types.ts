import type {
  ProblemStage,
  ProblemStatus,
} from '@/features/problems/api/problems-api.types';

export type ProblemTabId =
  | 'description'
  | 'attachments'
  | 'discussion'
  | 'linked-ideas';

export type ProblemDetailsCounts = {
  attachments: number;
  discussion: number;
  linkedIdeas: number;
};

export type ProblemDetailsStats = {
  views: number;
  comments: number;
  likes: number;
};

export type ProblemDetailsAuthor = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type ProblemDetailsViewer = {
  isAuthor: boolean;
  isMember: boolean;
  canJoin: boolean;
};

export type ProblemDetailsTeamMember = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type ProblemDetailsAttachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
};

export type ProblemDetailsLinkedIdea = {
  id: string;
  title: string;
  isPrimary: boolean;
  imageUrl: string | null;
  stats: ProblemDetailsStats;
};

export type ProblemDetails = {
  id: string;
  authorId: string;
  status: ProblemStatus;
  title: string;
  description: string;
  valueProposition: string | null;
  costBenefit: string | null;
  stage: string;
  stageValue: ProblemStage | null;
  tags: string[];
  author: ProblemDetailsAuthor;
  viewer: ProblemDetailsViewer;
  team: ProblemDetailsTeamMember[];
  attachments: ProblemDetailsAttachment[];
  linkedIdeas: ProblemDetailsLinkedIdea[];
  createdAt: string;
  stats: ProblemDetailsStats;
  counts: ProblemDetailsCounts;
};

export type SimilarProblemCard = {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorAvatarUrl: string | null;
  stage: string;
  tags: string[];
  stats: ProblemDetailsStats;
};
