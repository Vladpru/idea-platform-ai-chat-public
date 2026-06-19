import type {
  CreateProblemDraftPayload,
  CreateProblemPayload,
  MyProblemsListParams,
  ProblemForm,
  ProblemsDashboardParams,
  ProblemsFeedMeta,
  ProblemsFeedResponse,
  ProblemsListParams,
  ProblemStage,
  ProblemStatus,
  SuggestedIdeasParams,
  SuggestedIdeasResponse,
  UpdateProblemPayload,
  UploadProblemAttachmentPayload,
} from '@/features/problems/api/problems-api.types';
import { PROBLEMS_ROUTES } from '@/features/problems/api/problems.routes';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { isAxiosError } from 'axios';

import { createNotFoundError } from '@/shared/api/api-error';
import { api } from '@/shared/api/http';
import { db, type LocalProblem } from '@/shared/offline/db';
import { uuidv7 } from '@/shared/offline/id';
import {
  type MirrorProblemInput,
  mirrorProblemToDexie,
  mirrorProblemsListToDexie,
} from '@/shared/offline/repositories';

function isOfflineError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  if (!error.response) return true;
  return !navigator.onLine && error.response.status === 0;
}

function currentAuthorId(): string | null {
  return useAuthSessionStore.getState().user?.id ?? null;
}

async function readLocalProblems(
  predicate?: (row: LocalProblem) => boolean,
): Promise<ProblemForm[]> {
  const rows = await db.problems.filter(row => !row.deleted).toArray();
  const filtered = predicate ? rows.filter(predicate) : rows;
  return filtered.map(localProblemToProblemForm);
}

function isUnsyncedRow(row: LocalProblem): boolean {
  return (
    row.syncStatus === 'pending' ||
    row.syncStatus === 'failed' ||
    row.syncStatus === 'conflict'
  );
}

function mergePendingProblems(
  pending: ProblemForm[],
  network: ProblemForm[],
): ProblemForm[] {
  const ids = new Set(network.map(item => item.id));
  return [...pending.filter(item => !ids.has(item.id)), ...network];
}

function offlineProblemsMeta(total: number): ProblemsFeedMeta {
  return { total, page: 1, limit: total, totalPages: 1 };
}

function toMirrorProblemInput(form: ProblemForm): MirrorProblemInput {
  return {
    id: form.id,
    version: form.version ?? 0,
    authorId: form.author.id,
    title: form.title,
    status: form.status,
    stage: form.stage,
    snapshot: form as unknown as Record<string, unknown>,
  };
}

export function localProblemToProblemForm(local: LocalProblem): ProblemForm {
  const snapshot = local.snapshot as Partial<ProblemForm>;
  if (
    snapshot &&
    typeof snapshot === 'object' &&
    snapshot.author &&
    Array.isArray(snapshot.ideas)
  ) {
    return snapshot as ProblemForm;
  }
  return {
    id: local.localId,
    status: local.status as ProblemStatus,
    stage: local.stage as ProblemStage | null,
    title: local.title,
    description: (snapshot?.description as string) ?? '',
    valueProposition: (snapshot?.valueProposition as string | null) ?? null,
    costBenefit: (snapshot?.costBenefit as string | null) ?? null,
    category: (snapshot?.category as string | null) ?? null,
    impact: (snapshot?.impact as string | null) ?? null,
    aiSummary: null,
    summaryStatus: 'PENDING',
    publishedAt: null,
    ideas: [],
    tags: [],
    attachments: [],
    author: {
      id: local.authorId,
      email: '',
      firstName: null,
      lastName: null,
      avatarUrl: null,
    },
    viewer: { isAuthor: true, isMember: false, canJoin: false },
  };
}

export async function createProblem(
  payload: CreateProblemPayload,
): Promise<ProblemForm> {
  const id = uuidv7();

  try {
    const { data } = await api.post<ProblemForm>(PROBLEMS_ROUTES.root, {
      id,
      ...payload,
    });
    void mirrorProblemToDexie(toMirrorProblemInput(data));
    return data;
  } catch (error) {
    if (!isOfflineError(error)) throw error;

    const authorId = currentAuthorId();
    if (!authorId) throw error;

    const localProblem: LocalProblem = {
      localId: id,
      serverId: null,
      version: 0,
      title: payload.title ?? '',
      status: 'DRAFT',
      stage: payload.stage ?? null,
      authorId,
      syncStatus: 'pending',
      deleted: false,
      snapshot: { ...payload },
      updatedAt: new Date().toISOString(),
    };

    await db.problems.put(localProblem);

    return localProblemToProblemForm(localProblem);
  }
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
  void mirrorProblemsListToDexie(data.data.map(toMirrorProblemInput));
  const pending = await readLocalProblems(isUnsyncedRow);
  return { ...data, data: mergePendingProblems(pending, data.data) };
}

export async function fetchSuggestedIdeas(
  params: SuggestedIdeasParams,
): Promise<SuggestedIdeasResponse> {
  const { data } = await api.get<SuggestedIdeasResponse>(
    PROBLEMS_ROUTES.suggestedIdeas,
    { params },
  );
  return data;
}

export async function fetchMyProblems(
  params?: MyProblemsListParams,
): Promise<ProblemsFeedResponse> {
  try {
    const { data } = await api.get<ProblemsFeedResponse>(
      PROBLEMS_ROUTES.myDashboard,
      { params },
    );
    void mirrorProblemsListToDexie(data.data.map(toMirrorProblemInput));
    const pending = await readLocalProblems(isUnsyncedRow);
    return { ...data, data: mergePendingProblems(pending, data.data) };
  } catch (error) {
    if (!isOfflineError(error)) throw error;
    const userId = currentAuthorId();
    const data = await readLocalProblems(row => row.authorId === userId);
    return { data, meta: offlineProblemsMeta(data.length) };
  }
}

export async function fetchProblemsDashboard(
  params: ProblemsDashboardParams,
): Promise<ProblemsFeedResponse> {
  const matchesTab = (row: LocalProblem): boolean => {
    if (params.tab === 'drafts') return row.status === 'DRAFT';
    if (params.tab === 'published') return row.status === 'PUBLISHED';
    return true;
  };
  try {
    const { data } = await api.get<ProblemsFeedResponse>(
      PROBLEMS_ROUTES.myDashboard,
      { params },
    );
    void mirrorProblemsListToDexie(data.data.map(toMirrorProblemInput));
    const pending = await readLocalProblems(
      row => isUnsyncedRow(row) && matchesTab(row),
    );
    return { ...data, data: mergePendingProblems(pending, data.data) };
  } catch (error) {
    if (!isOfflineError(error)) throw error;
    const userId = currentAuthorId();
    const data = await readLocalProblems(
      row => row.authorId === userId && matchesTab(row),
    );
    return { data, meta: offlineProblemsMeta(data.length) };
  }
}

export async function fetchProblemById(id: string): Promise<ProblemForm> {
  try {
    const { data } = await api.get<ProblemForm>(PROBLEMS_ROUTES.byId(id));
    void mirrorProblemToDexie(toMirrorProblemInput(data));
    return data;
  } catch (error) {
    const offline = isOfflineError(error);
    const notFound = isAxiosError(error) && error.response?.status === 404;
    if (!offline && !notFound) throw error;

    const local = await db.problems.get(id);

    if (notFound) {
      if (
        local &&
        (local.serverId === null || local.syncStatus === 'pending')
      ) {
        return localProblemToProblemForm(local);
      }
      throw error;
    }

    if (!local) throw createNotFoundError('Problem not found');
    return localProblemToProblemForm(local);
  }
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

export async function joinProblem(problemId: string): Promise<void> {
  await api.post(PROBLEMS_ROUTES.join(problemId));
}

export async function leaveProblem(problemId: string): Promise<void> {
  await api.delete(PROBLEMS_ROUTES.leave(problemId));
}

export async function exportProblemPdf(problemId: string): Promise<void> {
  await api.post(PROBLEMS_ROUTES.exportPdf(problemId));
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
