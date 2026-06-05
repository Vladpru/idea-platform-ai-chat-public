import type {
  MediaProvider,
  Prisma,
  ProblemStatus,
  SummaryStatus,
} from '../../../generated/prisma/client';
import type { MediaKind } from '../../../generated/prisma/client';
import { PROBLEM_FORM_INCLUDE } from '../problem.constants';

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

export type ProblemFormRecord = Prisma.ProblemGetPayload<{
  include: typeof PROBLEM_FORM_INCLUDE;
}> & {
  likes?: Array<{ userId: string }>;
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
  aiSummary: string | null;
  summaryStatus: SummaryStatus;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
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
