import type { IdeaStatus } from '@/features/ideas/model/idea.types';

export type IdeaFormAuthorDto = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type IdeaFormMemberDto = {
  user: IdeaFormAuthorDto;
  joinedAt: string;
};

export type IdeaFormViewerDto = {
  isAuthor: boolean;
  isMember: boolean;
  canJoin: boolean;
};

export type IdeaFormProblemDto = {
  id: string;
  title: string;
  description: string;
  status: string;
  isPrimary: boolean;
  author: IdeaFormAuthorDto;
};

export type IdeaFormTagDto = {
  id: string;
  name: string;
};

export type IdeaMediaResponseDto = {
  id: string;
  kind: string;
  provider: string;
  url: string;
  mimeType: string;
  byteSize: number;
  originalFilename: string;
  sortOrder: number;
  createdAt: string;
};

export type IdeaFormResponseDto = {
  id: string;
  status: IdeaStatus;
  stage: string | null;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  problems: IdeaFormProblemDto[];
  tags: IdeaFormTagDto[];
  mainImage: IdeaMediaResponseDto | null;
  attachments: IdeaMediaResponseDto[];
  author: IdeaFormAuthorDto;
  members: IdeaFormMemberDto[];
  viewer: IdeaFormViewerDto;
};
