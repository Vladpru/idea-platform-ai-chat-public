import type {
  MediaProvider,
  ProblemStatus,
} from '../../../generated/prisma/client';
import type { MediaKind } from '../../../generated/prisma/client';

type DecimalLike = {
  toString(): string;
};

export type ProblemViewerDto = {
  isAuthor: boolean;
  isMember: boolean;
  canJoin: boolean;
};

export type ProblemFormAuthor = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type ProblemFormTag = {
  id: string;
  name: string;
};

export type ProblemMediaRecord = {
  id: string;
  kind: MediaKind;
  provider: MediaProvider;
  url: string;
  mimeType: string;
  byteSize: number;
  originalFilename: string;
  sortOrder: number;
  createdAt: Date;
};

export type ProblemFormRecord = {
  id: string;
  status: ProblemStatus;
  stage: string | null;
  title: string;
  description: string;
  valueProposition: string | null;
  costBenefit: DecimalLike | null;
  category: string | null;
  impact: string | null;
  publishedAt: Date | null;
  author: ProblemFormAuthor;
  ideas: Array<{
    isPrimary: boolean;
    idea: {
      id: string;
      title: string | null;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      media: Array<{ url: string }>;
    };
  }>;
  tags: Array<{
    tag: ProblemFormTag;
  }>;
  media: ProblemMediaRecord[];
};

export type ProblemLinkedIdea = {
  id: string;
  title: string | null;
  isPrimary: boolean;
  imageUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

export type ProblemMediaResponse = {
  id: string;
  kind: MediaKind;
  provider: MediaProvider;
  url: string;
  mimeType: string;
  byteSize: number;
  originalFilename: string;
  sortOrder: number;
  createdAt: string;
};

export type ProblemFormResponse = {
  id: string;
  status: ProblemStatus;
  stage: string | null;
  title: string;
  description: string;
  valueProposition: string | null;
  costBenefit: string | null;
  category: string | null;
  impact: string | null;
  publishedAt: string | null;
  ideas: ProblemLinkedIdea[];
  tags: ProblemFormTag[];
  attachments: ProblemMediaResponse[];
  author: ProblemFormAuthor;
  viewer: ProblemViewerDto;
};

export type ProblemsFeedMeta = {
  total?: number;
  totals?: {
    published: number;
    drafts: number;
    joined: number;
  };
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
};
export type ProblemsFeedResponse = {
  data: ProblemFormResponse[];
  meta: ProblemsFeedMeta;
};
