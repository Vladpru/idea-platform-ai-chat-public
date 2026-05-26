export interface SearchResultTag {
  id: string;
  name: string;
}

export interface GlobalSearchResultItem {
  id: string;
  entityType: 'IDEA' | 'PROBLEM';
  title: string;
  excerpt: string;
  status: string;
  stage: string | null;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  imageUrl: string | null;
  stats: { views: number; likes: number; comments: number };
  tags: SearchResultTag[];
}

export type SearchTab = 'ideas' | 'problems';

export interface SearchGroupResult {
  items: GlobalSearchResultItem[];
  total: number;
}

export interface GlobalSearchResultResponse {
  data: {
    ideas: SearchGroupResult;
    problems: SearchGroupResult;
  };
  meta: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}
