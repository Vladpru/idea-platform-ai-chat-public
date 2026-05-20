import { api } from '@/shared/api/http';

export type CreateProblemDraftPayload = {
  title?: string;
  description?: string;
};

export type ProblemDraft = {
  id: string;
  authorId: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  category: string | null;
  impact: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MyProblem = ProblemDraft;

export async function createProblemDraft(
  payload: CreateProblemDraftPayload,
): Promise<ProblemDraft> {
  const { data } = await api.post<ProblemDraft>('/problems/draft', payload);
  return data;
}

export async function fetchMyProblems(): Promise<MyProblem[]> {
  const { data } = await api.get<MyProblem[]>('/problems/mine');
  return data;
}
