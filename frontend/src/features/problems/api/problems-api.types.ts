export type ProblemStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ProblemStage = 'active' | 'completed' | 'archived';

export type ProblemAuthor = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type ProblemForm = {
  id: string;
  status: ProblemStatus;
  stage: ProblemStage | null;
  title: string;
  description: string;
  valueProposition: string | null;
  costBenefit: string | null;
  category: string | null;
  impact: string | null;
  publishedAt: string | null;
  ideas: Array<{
    id: string;
    title: string | null;
    status: string;
    isPrimary: boolean;
    author: ProblemAuthor;
  }>;
  tags: Array<{ id: string; name: string }>;
  attachments: Array<{
    id: string;
    kind: string;
    url: string;
    mimeType: string;
    originalFilename: string;
  }>;
  author: ProblemAuthor;
};

export type ProblemsFeedMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ProblemsFeedResponse = {
  data: ProblemForm[];
  meta: ProblemsFeedMeta;
};

export type ProblemDraft = ProblemForm;

export type MyProblem = ProblemForm;

export type ProblemListSort =
  | 'newest'
  | 'oldest'
  | 'most-viewed'
  | 'most-popular'
  | 'most-ideas-linked';

export type ProblemsListParams = {
  page?: number;
  limit?: number;
  stage?: ProblemStage;
  sort?: ProblemListSort;
};

export type MyProblemsListParams = ProblemsListParams & {
  status?: ProblemStatus;
};

export type CreateProblemPayload = {
  isPublished: boolean;
  stage?: ProblemStage;
  title?: string;
  description?: string;
  valueProposition?: string;
  costBenefit?: string;
  category?: string;
  impact?: string;
  ideaIds?: string[];
  tagIds?: string[];
  tagLabels?: string[];
};

export type CreateProblemDraftPayload = Pick<
  CreateProblemPayload,
  'title' | 'description'
>;

export type UpdateProblemPayload = Omit<CreateProblemPayload, 'isPublished'>;

export type UploadProblemAttachmentPayload = {
  file: File;
};
