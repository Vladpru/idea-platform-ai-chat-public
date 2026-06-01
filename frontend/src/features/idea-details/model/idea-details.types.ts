import type { ApiStage, IdeaStatus } from '@/features/ideas/model/idea.types';

export type IdeaTabId =
  | 'description'
  | 'attachments'
  | 'discussion'
  | 'linked-problems';

export type IdeaDetailsCounts = {
  attachments: number;
  discussion: number;
  linkedProblems: number;
};

export type IdeaDetailsStats = {
  views: number;
  comments: number;
  likes: number;
};

export type IdeaDetailsAuthor = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type IdeaDetailsMember = {
  user: IdeaDetailsAuthor;
  joinedAt: string;
};

export type IdeaDetailsViewer = {
  isAuthor: boolean;
  isMember: boolean;
  canJoin: boolean;
};

export type IdeaDetailsTeamMember = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type IdeaDetailsAttachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  byteSize: number;
};

export type IdeaDetailsLinkedProblem = {
  id: string;
  title: string;
  description: string;
  isPrimary: boolean;
  status: string;
  stage: string;
  authorName: string;
  authorAvatarUrl: string | null;
  imageUrl: string | null;
  tags: string[];
  stats: IdeaDetailsStats;
  isLiked?: boolean;
};

export type IdeaDetailsMainImage = {
  id: string;
  url: string;
};

export type IdeaDetails = {
  id: string;
  commentCount: number;
  authorId: string;
  status: IdeaStatus;
  title: string;
  description: string;
  stage: string;
  stageValue: ApiStage | null;
  mainImage: IdeaDetailsMainImage | null;
  mainImageUrl: string | null;
  tags: string[];
  author: IdeaDetailsAuthor;
  members: IdeaDetailsMember[];
  viewer: IdeaDetailsViewer;
  team: IdeaDetailsTeamMember[];
  attachments: IdeaDetailsAttachment[];
  linkedProblems: IdeaDetailsLinkedProblem[];
  createdAt: string;
  isLiked: boolean;
  stats: IdeaDetailsStats;
  counts: IdeaDetailsCounts;
};

export type SimilarIdeaCard = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  stage: string;
  tags: string[];
  stats: IdeaDetailsStats;
  isLiked?: boolean;
  externalUrl?: string;
};

export type SimilarIdeasSubTab = 'IDEA_ENGINE' | 'FOUND_ON_WEB';
