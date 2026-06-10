export type UserContributionKind = 'idea' | 'problem';

export type UserContributionSortRow = {
  id: string;
  kind: UserContributionKind;
  publishedAt: Date | null;
  createdAt: Date;
};

export type UserContributionAuthor = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type UserContributionTag = {
  id: string;
  name: string;
};

export type UserContributionMedia = {
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

export type UserContributionViewer = {
  isAuthor: boolean;
  isMember: boolean;
  canJoin: boolean;
};

export type UserContributionIdeaItem = {
  kind: 'idea';
  id: string;
  status: string;
  stage: string | null;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  tags: UserContributionTag[];
  mainImage: UserContributionMedia | null;
  author: UserContributionAuthor;
  problems: [];
  viewer: UserContributionViewer;
};

export type UserContributionProblemItem = {
  kind: 'problem';
  id: string;
  status: string;
  stage: string | null;
  title: string;
  description: string;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  tags: UserContributionTag[];
  mainImage: UserContributionMedia | null;
  author: UserContributionAuthor;
  ideas: [];
  viewer: UserContributionViewer;
};

export type UserContributionItem =
  | UserContributionIdeaItem
  | UserContributionProblemItem;

export type UserContributionsResponse = {
  data: UserContributionItem[];
  meta: {
    skip: number;
    take: number;
    total: number;
  };
};

export type UserStatistics = {
  ideas: number;
  problems: number;
  totalViews: number;
  totalLikes: number;
};
