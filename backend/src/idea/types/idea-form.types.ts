import type {
  IdeaStatus,
  MediaKind,
  MediaProvider,
  ProblemStatus,
  Stage,
} from '../../../generated/prisma/client';

export type IdeaFormAuthor = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type IdeaFormProblem = {
  id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  isPrimary: boolean;
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
