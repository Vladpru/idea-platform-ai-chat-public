import type { ApiStage, IdeaStatus } from '@/features/ideas/model/idea.types';

export type IdeasListParams = {
  status?: IdeaStatus;
  authorId?: string;
  page?: number;
  limit?: number;
};

export type IdeasListResponse = {
  items: import('@/features/ideas/model/idea.types').IdeaApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateIdeaPayload = {
  status?: IdeaStatus;
  stage?: ApiStage | null;
  title?: string | null;
  description?: string | null;
  problemIds?: string[];
  tagLabels?: string[];
};

export type UpdateIdeaPayload = Partial<CreateIdeaPayload>;

/** Alias used by draft save flow. */
export type SaveIdeaDraftPayload = UpdateIdeaPayload;

export type PublishIdeaPayload = {
  stage?: ApiStage | null;
  title: string;
  description: string;
  problemIds: string[];
  tagLabels?: string[];
};

export type UploadIdeaMediaPayload = {
  file: File;
  kind?: 'main' | 'attachment';
};
