import type {
  IdeaStatus,
  MediaProvider,
  ProblemStatus,
} from '../../../generated/prisma/client';
import type { MediaKind } from '../../../generated/prisma/client';

type DecimalLike = {
  toString(): string;
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
      status: IdeaStatus;
      author: ProblemFormAuthor;
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
  status: IdeaStatus;
  isPrimary: boolean;
  author: ProblemFormAuthor;
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
};

export type ProblemsFeedMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ProblemsFeedResponse = {
  data: ProblemFormResponse[];
  meta: ProblemsFeedMeta;
};
