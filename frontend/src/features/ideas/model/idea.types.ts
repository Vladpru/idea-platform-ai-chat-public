import type { IdeaStage } from '@/features/ideas/lib/stages';

export const IDEA_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type IdeaStatus = (typeof IDEA_STATUS)[keyof typeof IDEA_STATUS];

export const API_STAGE = {
  IDEATION: 'IDEATION',
  PROTOTYPING: 'PROTOTYPING',
  COMPLETED: 'COMPLETED',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ApiStage = (typeof API_STAGE)[keyof typeof API_STAGE];

export type IdeaProblemLink = {
  id: string;
  problemId: string;
};

export type IdeaTagLink = {
  id: string;
  tagId: string;
  label?: string;
};

export type IdeaMediaItem = {
  id: string;
  url: string;
  kind: 'main' | 'attachment';
};

export type IdeaApi = {
  id: string;
  authorId: string;
  status: IdeaStatus;
  stage: ApiStage | null;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  problems?: IdeaProblemLink[];
  tags?: IdeaTagLink[];
  media?: IdeaMediaItem[];
};

/**
 * Draft slice for the create-idea flow (single idea per session).
 * Nullable fields mirror optional DB columns while editing.
 */
export type CreateIdeaDraft = {
  id: string | null;
  authorId: string | null;
  status: IdeaStatus;
  stage: IdeaStage | null;
  title: string;
  description: string;
  problemIds: string[];
  tags: string[];
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateIdeaLocalFiles = {
  mainImage: File | null;
  attachments: File[];
};
