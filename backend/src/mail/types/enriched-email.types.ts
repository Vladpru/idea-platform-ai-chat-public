export type EnrichedEntityCard = {
  entityType: 'idea' | 'problem';
  entityId: string;
  title: string;
  descriptionExcerpt: string | null;
  imageUrl: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  stageLabel: string | null;
  statusLabel: string;
  tags: string[];
  extraTagCount: number;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  detailUrl: string;
  editUrl: string | null;
};

export type EnrichedCommentContext = {
  actorName: string;
  actorAvatarUrl: string | null;
  timestamp: string;
  entityTitle: string;
  entityType: 'idea' | 'problem';
  entityId: string;
  contentSnippet: string;
  replyUrl: string;
};

export type EnrichedEmailContext = {
  frontendUrl: string;
  settingsUrl: string;
  entity?: EnrichedEntityCard;
  comment?: EnrichedCommentContext;
};
