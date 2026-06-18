export type PdfExportJobData = {
  entityType: 'idea' | 'problem';
  entityId: string;
  userId: string;
  title: string;
};

export type PdfAuthorPayload = {
  name: string;
  avatar_url: string | null;
};

export type PdfContributorPayload = {
  name: string;
  avatar_url: string | null;
};

export type PdfLinkedEntityPayload = {
  id: string;
  title: string;
  type: 'idea' | 'problem';
};

export type PdfCommentPayload = {
  author: string;
  body: string;
  created_at: string;
};

export type PdfGeneratePayload = {
  entity_type: 'idea' | 'problem';
  entity_id: string;
  title: string;
  description: string;
  ai_summary: string | null;
  author: PdfAuthorPayload;
  contributors: PdfContributorPayload[];
  status: string;
  stage: string | null;
  tags: string[];
  like_count: number;
  view_count: number;
  comment_count: number;
  published_at: string | null;
  linked_entities: PdfLinkedEntityPayload[];
  comments: PdfCommentPayload[];
  cover_image_url: string | null;
};

export type PdfServiceResponse = {
  download_url: string;
  expires_at: string;
};

export type PdfReadySocketPayload = {
  download_url: string;
  expires_at: string;
  entity_type: 'idea' | 'problem';
  entity_id: string;
  title: string;
};

export type PdfFailedSocketPayload = {
  entity_type: 'idea' | 'problem';
  entity_id: string;
  title: string;
};
