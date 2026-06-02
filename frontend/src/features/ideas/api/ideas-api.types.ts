import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import type { ApiStage, IdeaStatus } from '@/features/ideas/model/idea.types';

export type IdeaSortOption = 'newest' | 'oldest' | 'views' | 'likes' | 'comments';

export type IdeasListParams = {
  status?: IdeaStatus;
  authorId?: string;
  page?: number;
  limit?: number;
  stage?: ApiStage;
  sort?: IdeaSortOption;
};

export type IdeasFeedMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Present only in dashboard (BFF) responses */
  totals?: {
    published: number;
    drafts: number;
    joined: number;
  };
};

export type IdeasFeedResponse = {
  data: IdeaFormResponseDto[];
  meta: IdeasFeedMeta;
};

export type IdeasDashboardTab = 'published' | 'drafts' | 'joined';

export type IdeasDashboardParams = {
  tab: IdeasDashboardTab;
  page?: number;
  limit?: number;
};

/** @deprecated Use IdeasFeedResponse — kept for gradual migration */
export type IdeasListResponse = {
  items: import('@/features/ideas/model/idea.types').IdeaApi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type IdeaWritePayload = {
  stage?: ApiStage | null;
  title?: string | null;
  description?: string | null;
  problemIds?: string[];
  tagLabels?: string[];
};

export type CreateIdeaPayload = IdeaWritePayload & {
  isPublished: boolean;
};

export type UpdateIdeaPayload = IdeaWritePayload;

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

export type IdeaAIPrefillMode = 'draft' | 'title' | 'description';

export type GenerateIdeaPrefillPayload = {
  mode: IdeaAIPrefillMode;
  userPrompt: string;
  title?: string;
  description?: string;
};

export type IdeaAIPrefillResponse = {
  title: string;
  description: string;
  problemStatement: string;
  tags: string[];
};
