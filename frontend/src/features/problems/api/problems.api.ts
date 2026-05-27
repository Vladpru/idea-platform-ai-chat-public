import type {
  CreateProblemDraftPayload,
  CreateProblemPayload,
  MyProblemsListParams,
  ProblemForm,
  ProblemsDashboardParams,
  ProblemsFeedResponse,
  ProblemsListParams,
  UpdateProblemPayload,
  UploadProblemAttachmentPayload,
} from '@/features/problems/api/problems-api.types';
import { PROBLEMS_ROUTES } from '@/features/problems/api/problems.routes';

import { api } from '@/shared/api/http';

export async function createProblem(
  payload: CreateProblemPayload,
): Promise<ProblemForm> {
  const { data } = await api.post<ProblemForm>(PROBLEMS_ROUTES.root, payload);
  return data;
}

export async function createProblemDraft(
  payload: CreateProblemDraftPayload,
): Promise<ProblemForm> {
  return createProblem({ ...payload, isPublished: false });
}

export async function fetchProblems(
  params?: ProblemsListParams,
): Promise<ProblemsFeedResponse> {
  const { data } = await api.get<ProblemsFeedResponse>(PROBLEMS_ROUTES.root, {
    params,
  });
  return data;
}

export async function fetchMyProblems(
  params?: MyProblemsListParams,
): Promise<ProblemsFeedResponse> {
  const { data } = await api.get<ProblemsFeedResponse>(PROBLEMS_ROUTES.myDashboard, {
    params,
  });
  return data;
}

export async function fetchProblemsDashboard(
  params: ProblemsDashboardParams,
): Promise<ProblemsFeedResponse> {
  const { data } = await api.get<ProblemsFeedResponse>(
    PROBLEMS_ROUTES.myDashboard,
    { params },
  );
  return data;
}

export async function fetchProblemById(id: string): Promise<ProblemForm> {
  const { data } = await api.get<ProblemForm>(PROBLEMS_ROUTES.byId(id));
  return data;
}

export async function updateProblem(
  id: string,
  payload: UpdateProblemPayload,
): Promise<ProblemForm> {
  const { data } = await api.patch<ProblemForm>(
    PROBLEMS_ROUTES.byId(id),
    payload,
  );
  return data;
}

export async function deleteProblem(id: string): Promise<void> {
  await api.delete(PROBLEMS_ROUTES.byId(id));
}

export async function uploadProblemAttachment(
  problemId: string,
  { file }: UploadProblemAttachmentPayload,
): Promise<ProblemForm> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<ProblemForm>(
    PROBLEMS_ROUTES.media(problemId),
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
  await api.delete(PROBLEMS_ROUTES.mediaById(problemId, mediaId));
}

export type {
  CreateProblemDraftPayload,
  CreateProblemPayload,
  MyProblem,
  MyProblemsListParams,
  ProblemAuthor,
  ProblemDraft,
  ProblemForm,
  ProblemsDashboardParams,
  ProblemsDashboardTab,
  ProblemsFeedMeta,
  ProblemsFeedResponse,
  ProblemsListParams,
  ProblemStage,
  ProblemStatus,
  UpdateProblemPayload,
  UploadProblemAttachmentPayload,
} from '@/features/problems/api/problems-api.types';
