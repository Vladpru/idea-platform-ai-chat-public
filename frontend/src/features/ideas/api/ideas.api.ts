import type {
  CreateIdeaPayload,
  GenerateIdeaPrefillPayload,
  IdeaAIPrefillResponse,
  IdeasDashboardParams,
  IdeasFeedMeta,
  IdeasFeedResponse,
  IdeasListParams,
  SaveIdeaDraftPayload,
  UpdateIdeaPayload,
  UploadIdeaMediaPayload,
} from '@/features/ideas/api/ideas-api.types';
import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import { ideaFormDtoToIdeaApi } from '@/features/ideas/api/idea-form.mappers';
import { IDEAS_ROUTES } from '@/features/ideas/api/ideas.routes';
import {
  IDEA_STATUS,
  type IdeaApi,
  type IdeaMediaItem,
  type IdeaStatus,
} from '@/features/ideas/model/idea.types';
import { useAuthSessionStore } from '@/features/auth/model/auth-session-store';
import { isAxiosError } from 'axios';

import { uuidv7 } from '@/shared/offline/id';

import { createNotFoundError } from '@/shared/api/api-error';
import { api } from '@/shared/api/http';
import { db, type LocalIdea } from '@/shared/offline/db';
import {
  type MirrorIdeaInput,
  mirrorIdeaToDexie,
  mirrorIdeasListToDexie,
} from '@/shared/offline/repositories';

function toMirrorIdeaInput(dto: IdeaFormResponseDto): MirrorIdeaInput {
  return {
    id: dto.id,
    version: dto.version ?? 0,
    authorId: dto.author.id,
    title: dto.title,
    status: dto.status,
    stage: dto.stage,
    snapshot: dto as unknown as Record<string, unknown>,
  };
}

function localIdeaToFormDto(local: LocalIdea): IdeaFormResponseDto {
  const snapshot = local.snapshot as Partial<IdeaFormResponseDto>;
  if (
    snapshot &&
    typeof snapshot === 'object' &&
    snapshot.author &&
    Array.isArray(snapshot.problems)
  ) {
    return snapshot as IdeaFormResponseDto;
  }
  return {
    id: local.localId,
    version: local.version,
    status: local.status as IdeaStatus,
    stage: local.stage,
    title: local.title,
    description: (snapshot?.description as string | null) ?? null,
    aiSummary: null,
    summaryStatus: 'PENDING',
    publishedAt: null,
    problems: [],
    tags: [],
    mainImage: null,
    attachments: [],
    author: {
      id: local.authorId,
      email: '',
      firstName: null,
      lastName: null,
      avatarUrl: null,
    },
    members: [],
    viewer: { isAuthor: true, isMember: false, canJoin: false },
  };
}

function isOfflineError(error: unknown): boolean {
  if (!navigator.onLine) return true;
  if (!isAxiosError(error)) return false;
  return (
    error.code === 'ERR_INTERNET_DISCONNECTED' ||
    error.message === 'Network Error'
  );
}

function currentAuthorId(): string | null {
  return useAuthSessionStore.getState().user?.id ?? null;
}

async function readLocalIdeas(
  predicate?: (row: LocalIdea) => boolean,
): Promise<IdeaFormResponseDto[]> {
  const rows = await db.ideas.filter(row => !row.deleted).toArray();
  const filtered = predicate ? rows.filter(predicate) : rows;
  return filtered.map(localIdeaToFormDto);
}

function isUnsyncedRow(row: LocalIdea): boolean {
  return (
    row.syncStatus === 'pending' ||
    row.syncStatus === 'failed' ||
    row.syncStatus === 'conflict'
  );
}

function mergePendingIdeas(
  pending: IdeaFormResponseDto[],
  network: IdeaFormResponseDto[],
): IdeaFormResponseDto[] {
  const ids = new Set(network.map(item => item.id));
  return [...pending.filter(item => !ids.has(item.id)), ...network];
}

function offlineIdeasMeta(total: number): IdeasFeedMeta {
  return { total, page: 1, limit: total, totalPages: 1 };
}

export async function fetchIdeas(
  params?: IdeasListParams,
): Promise<IdeasFeedResponse> {
  const { data } = await api.get<IdeasFeedResponse>(IDEAS_ROUTES.root, {
    params,
  });
  void mirrorIdeasListToDexie(data.data.map(toMirrorIdeaInput));
  const pending = await readLocalIdeas(isUnsyncedRow);
  return { ...data, data: mergePendingIdeas(pending, data.data) };
}

export async function fetchMyIdeas(
  params?: IdeasListParams,
): Promise<IdeasFeedResponse> {
  try {
    const { data } = await api.get<IdeasFeedResponse>(
      IDEAS_ROUTES.myDashboard,
      {
        params,
      },
    );
    void mirrorIdeasListToDexie(data.data.map(toMirrorIdeaInput));
    const pending = await readLocalIdeas(isUnsyncedRow);
    return { ...data, data: mergePendingIdeas(pending, data.data) };
  } catch (error) {
    if (!isOfflineError(error)) throw error;
    const userId = currentAuthorId();
    const data = await readLocalIdeas(row => row.authorId === userId);
    return { data, meta: offlineIdeasMeta(data.length) };
  }
}

export async function fetchIdeasDashboard(
  params: IdeasDashboardParams,
): Promise<IdeasFeedResponse> {
  const matchesTab = (row: LocalIdea): boolean => {
    if (params.tab === 'drafts') return row.status === 'DRAFT';
    if (params.tab === 'published') return row.status === 'PUBLISHED';
    return true;
  };

  try {
    const { data } = await api.get<IdeasFeedResponse>(
      IDEAS_ROUTES.myDashboard,
      {
        params,
      },
    );
    void mirrorIdeasListToDexie(data.data.map(toMirrorIdeaInput));
    const pending = await readLocalIdeas(
      row => isUnsyncedRow(row) && matchesTab(row),
    );
    return { ...data, data: mergePendingIdeas(pending, data.data) };
  } catch (error) {
    if (!isOfflineError(error)) throw error;

    const userId = currentAuthorId();
    const allLocalIdeas = await readLocalIdeas();

    const data = allLocalIdeas.filter(
      row =>
        row.author.id === userId && matchesTab(row as unknown as LocalIdea),
    );
    data.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );

    return { data, meta: offlineIdeasMeta(data.length) };
  }
}

export async function fetchIdeaById(ideaId: string): Promise<IdeaApi> {
  const dto = await fetchIdeaFormById(ideaId);
  return ideaFormDtoToIdeaApi(dto);
}

export async function fetchIdeaFormById(
  ideaId: string,
): Promise<IdeaFormResponseDto> {
  try {
    const { data } = await api.get<IdeaFormResponseDto>(
      IDEAS_ROUTES.byId(ideaId),
    );
    void mirrorIdeaToDexie(toMirrorIdeaInput(data));
    return data;
  } catch (error) {
    const offline = isOfflineError(error);
    const notFound = isAxiosError(error) && error.response?.status === 404;
    if (!offline && !notFound) throw error;

    const local = await db.ideas.get(ideaId);

    if (notFound) {
      if (
        local &&
        (local.serverId === null || local.syncStatus === 'pending')
      ) {
        return localIdeaToFormDto(local);
      }
      throw error;
    }

    if (!local) throw createNotFoundError('Idea not found');
    return localIdeaToFormDto(local);
  }
}

export async function createIdea(payload: CreateIdeaPayload): Promise<IdeaApi> {
  const { data } = await api.post<IdeaApi>(IDEAS_ROUTES.root, {
    id: uuidv7(),
    ...payload,
  });
  return data;
}

export async function createIdeaDraft(
  payload: SaveIdeaDraftPayload,
): Promise<IdeaApi> {
  return createIdea({ isPublished: false, ...payload });
}

export async function createPublishedIdea(
  payload: SaveIdeaDraftPayload,
): Promise<IdeaApi> {
  return createIdea({ isPublished: true, ...payload });
}

export async function updateIdea(
  ideaId: string,
  payload: UpdateIdeaPayload,
): Promise<IdeaApi> {
  try {
    const { data } = await api.patch<IdeaApi>(
      IDEAS_ROUTES.byId(ideaId),
      payload,
    );
    return data;
  } catch (error) {
    if (!isOfflineError(error)) throw error;

    const local = await db.ideas.get(ideaId);
    if (!local) throw error;

    const now = new Date().toISOString();

    await db.ideas.update(ideaId, {
      ...(payload.title !== undefined && { title: payload.title }),
      ...(payload.stage !== undefined && { stage: payload.stage }),
      syncStatus: 'pending',
      updatedAt: now,
    });

    await db.outbox.add({
      id: uuidv7(),
      op: 'update',
      entity: 'idea',
      entityLocalId: ideaId,
      payload,
      baseVersion: local.version,
      dependsOn: [],
      status: 'queued',
      attempts: 0,
      nextAttemptAt: now,
      createdAt: now,
    });

    const snap = local.snapshot as {
      description?: string | null;
      publishedAt?: string | null;
      createdAt?: string;
    };

    return {
      id: ideaId,
      authorId: local.authorId,
      status: local.status as IdeaStatus,
      stage: (payload.stage !== undefined
        ? payload.stage
        : local.stage) as IdeaApi['stage'],
      title: payload.title !== undefined ? payload.title : local.title,
      description:
        payload.description !== undefined
          ? (payload.description ?? null)
          : (snap.description ?? null),
      publishedAt: snap.publishedAt ?? null,
      createdAt: snap.createdAt ?? local.updatedAt,
      updatedAt: now,
    };
  }
}

export async function updateIdeaDraft(
  ideaId: string,
  payload: SaveIdeaDraftPayload,
): Promise<IdeaApi> {
  return updateIdea(ideaId, payload);
}

export async function publishIdea(ideaId: string): Promise<IdeaApi> {
  const { data } = await api.post<IdeaApi>(IDEAS_ROUTES.publish(ideaId));
  return data;
}

export async function updatePublishedIdea(
  ideaId: string,
  payload: SaveIdeaDraftPayload,
): Promise<IdeaApi> {
  const { data } = await api.patch<IdeaApi>(
    IDEAS_ROUTES.publish(ideaId),
    payload,
  );
  return data;
}

export async function deleteIdea(ideaId: string): Promise<void> {
  await api.delete(IDEAS_ROUTES.byId(ideaId));
}

export async function joinIdea(ideaId: string): Promise<void> {
  await api.post(IDEAS_ROUTES.join(ideaId));
}

export async function leaveIdea(ideaId: string): Promise<void> {
  await api.delete(IDEAS_ROUTES.leave(ideaId));
}

export async function uploadIdeaMedia(
  ideaId: string,
  { file }: UploadIdeaMediaPayload,
): Promise<IdeaMediaItem> {
  const body = new FormData();
  body.append('file', file);

  const { data } = await api.post<IdeaMediaItem>(
    IDEAS_ROUTES.media(ideaId),
    body,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function uploadIdeaMainImage(
  ideaId: string,
  file: File,
): Promise<IdeaApi> {
  const body = new FormData();
  body.append('file', file);

  const { data } = await api.put<IdeaApi>(
    IDEAS_ROUTES.mainImage(ideaId),
    body,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function generateIdeaPrefill(
  payload: GenerateIdeaPrefillPayload,
): Promise<IdeaAIPrefillResponse> {
  const { data } = await api.post<{ data: IdeaAIPrefillResponse }>(
    IDEAS_ROUTES.prefill,
    payload,
  );
  return data.data;
}

export async function deleteIdeaMedia(
  ideaId: string,
  mediaId: string,
): Promise<void> {
  await api.delete(IDEAS_ROUTES.mediaById(ideaId, mediaId));
}

async function updateIdeaProblemLinks(
  ideaId: string,
  problemIds: string[],
): Promise<IdeaFormResponseDto> {
  const form = await fetchIdeaFormById(ideaId);
  const payload = { problemIds };

  if (form.status === IDEA_STATUS.PUBLISHED) {
    await updatePublishedIdea(ideaId, payload);
  } else {
    await updateIdea(ideaId, payload);
  }

  return fetchIdeaFormById(ideaId);
}

export async function linkProblemsToIdea(
  ideaId: string,
  problemIds: string[],
): Promise<IdeaFormResponseDto> {
  const form = await fetchIdeaFormById(ideaId);
  const existingIds = form.problems.map(problem => problem.id);
  const mergedProblemIds = [...new Set([...existingIds, ...problemIds])];
  return updateIdeaProblemLinks(ideaId, mergedProblemIds);
}

export async function unlinkProblemFromIdea(
  ideaId: string,
  problemId: string,
): Promise<IdeaFormResponseDto> {
  const form = await fetchIdeaFormById(ideaId);
  const remainingProblemIds = form.problems
    .map(problem => problem.id)
    .filter(id => id !== problemId);
  return updateIdeaProblemLinks(ideaId, remainingProblemIds);
}

export type {
  CreateIdeaPayload,
  IdeaSortOption,
  IdeasDashboardParams,
  IdeasDashboardTab,
  IdeasFeedMeta,
  IdeasFeedResponse,
  IdeasListParams,
  IdeasListResponse,
  PublishIdeaPayload,
  SaveIdeaDraftPayload,
  UpdateIdeaPayload,
  UploadIdeaMediaPayload,
  GenerateIdeaPrefillPayload,
  IdeaAIPrefillMode,
  IdeaAIPrefillResponse,
} from '@/features/ideas/api/ideas-api.types';
