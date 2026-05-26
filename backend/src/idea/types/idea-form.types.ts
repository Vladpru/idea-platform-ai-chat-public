import type {
  IdeaStatus,
  MediaKind,
  MediaProvider,
  ProblemStatus,
  Stage,
} from '../../../generated/prisma/client';

export type IdeaFormAuthor = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type IdeaFormMember = {
  user: IdeaFormAuthor;
  joinedAt: string;
};

export type IdeaFormProblem = {
  id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  isPrimary: boolean;
  author: IdeaFormAuthor;
};

export type IdeaFormTag = {
  id: string;
  name: string;
};

export type IdeaMediaResponse = {
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

export type IdeaFormResponse = {
  id: string;
  status: IdeaStatus;
  stage: Stage | null;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  problems: IdeaFormProblem[];
  tags: IdeaFormTag[];
  mainImage: IdeaMediaResponse | null;
  attachments: IdeaMediaResponse[];
  author: IdeaFormAuthor;
  viewer: {
    isAuthor: boolean;
    isMember: boolean;
    canJoin: boolean;
  };
  members: IdeaFormMember[];
};

export type IdeasFeedMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type IdeasFeedResponse = {
  data: IdeaFormResponse[];
  meta: IdeasFeedMeta;
};
