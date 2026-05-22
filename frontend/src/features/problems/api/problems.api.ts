import { api } from '@/shared/api/http';

export type ProblemStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ProblemStage = 'active' | 'completed' | 'archived';

export type ProblemAuthor = {
  id: string;
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

export type ProblemsFeedResponse = {
  data: ProblemForm[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/** @deprecated Use ProblemForm */
export type ProblemDraft = ProblemForm;

/** @deprecated Use ProblemForm */
export type MyProblem = ProblemForm;

export type CreateProblemDraftPayload = Pick<
  CreateProblemPayload,
  'title' | 'description'
>;

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

export type UpdateProblemPayload = Omit<CreateProblemPayload, 'isPublished'>;

export async function createProblem(
  payload: CreateProblemPayload,
): Promise<ProblemForm> {
  const { data } = await api.post<ProblemForm>('/problems', payload);
  return data;
}

/** @deprecated Use createProblem with isPublished: false */
export async function createProblemDraft(
  payload: Pick<CreateProblemPayload, 'title' | 'description'>,
): Promise<ProblemForm> {
  return createProblem({ ...payload, isPublished: false });
}

export async function fetchProblems(
  params?: { page?: number; limit?: number; stage?: ProblemStage },
): Promise<ProblemsFeedResponse> {
  const { data } = await api.get<ProblemsFeedResponse>('/problems', { params });
  return data;
}

export async function fetchMyProblems(
  params?: {
    page?: number;
    limit?: number;
    stage?: ProblemStage;
    status?: ProblemStatus;
  },
): Promise<ProblemsFeedResponse> {
  const { data } = await api.get<ProblemsFeedResponse>('/problems/mine', {
    params,
  });
  return data;
}

export async function fetchProblemById(id: string): Promise<ProblemForm> {
  const { data } = await api.get<ProblemForm>(`/problems/${id}`);
  return data;
}

export async function updateProblem(
  id: string,
  payload: UpdateProblemPayload,
): Promise<ProblemForm> {
  const { data } = await api.patch<ProblemForm>(`/problems/${id}`, payload);
  return data;
}

export async function deleteProblem(id: string): Promise<void> {
  await api.delete(`/problems/${id}`);
}

export async function uploadProblemAttachment(
  problemId: string,
  file: File,
): Promise<ProblemForm> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<ProblemForm>(
    `/problems/${problemId}/media`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function deleteProblemMedia(
  problemId: string,
  mediaId: string,
): Promise<void> {
  await api.delete(`/problems/${problemId}/media/${mediaId}`);
}
