import type {
  CreateIdeaPayload,
  GenerateIdeaPrefillPayload,
  IdeaAIPrefillResponse,
  IdeasDashboardParams,
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
} from '@/features/ideas/model/idea.types';

import { api } from '@/shared/api/http';

export async function fetchIdeas(
  params?: IdeasListParams,
): Promise<IdeasFeedResponse> {
  const { data } = await api.get<IdeasFeedResponse>(IDEAS_ROUTES.root, {
    params,
  });
  return data;
}

export async function fetchMyIdeas(
  params?: IdeasListParams,
): Promise<IdeasFeedResponse> {
  const { data } = await api.get<IdeasFeedResponse>(IDEAS_ROUTES.myDashboard, {
    params,
  });
  return data;
}

export async function fetchIdeasDashboard(
  params: IdeasDashboardParams,
): Promise<IdeasFeedResponse> {
  const { data } = await api.get<IdeasFeedResponse>(IDEAS_ROUTES.myDashboard, {
    params,
  });
  return data;
}

export async function fetchIdeaById(ideaId: string): Promise<IdeaApi> {
  const dto = await fetchIdeaFormById(ideaId);
  return ideaFormDtoToIdeaApi(dto);
}

export async function fetchIdeaFormById(
  ideaId: string,
): Promise<IdeaFormResponseDto> {
  const { data } = await api.get<IdeaFormResponseDto>(IDEAS_ROUTES.byId(ideaId));
  return data;
}

export async function createIdea(payload: CreateIdeaPayload): Promise<IdeaApi> {
  const { data } = await api.post<IdeaApi>(IDEAS_ROUTES.root, payload);
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
  const { data } = await api.patch<IdeaApi>(IDEAS_ROUTES.byId(ideaId), payload);
  return data;
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
