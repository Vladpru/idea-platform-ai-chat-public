export interface SearchResultRow {
  id: string;
  entity_type: 'IDEA' | 'PROBLEM';
  title: string;
  description: string | null;
  status: string;
  stage: string | null;
  created_at: Date;
  rank: number;
  author_id: string;
  author_first_name: string | null;
  author_last_name: string | null;
  author_avatar_url: string | null;
  image_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  tags: string | { id: string; name: string }[];
  total_count?: bigint;
  is_ai_suggested: boolean;
}

export interface CountRow {
  total: bigint;
}

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
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  imageUrl: string | null;
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  tags: SearchResultTag[];
  isAiSuggested: boolean;
}

export interface GlobalSearchResultResponse {
  data: {
    ideas: { items: GlobalSearchResultItem[]; total: number };
    problems: { items: GlobalSearchResultItem[]; total: number };
  };
  meta: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}
