import type {
  CreateIdeaPayload,
  IdeasListParams,
  IdeasListResponse,
  PublishIdeaPayload,
  SaveIdeaDraftPayload,
  UpdateIdeaPayload,
  UploadIdeaMediaPayload,
} from '@/features/ideas/api/ideas-api.types';
import { IDEAS_ROUTES } from '@/features/ideas/api/ideas.routes';
import type { IdeaApi, IdeaMediaItem } from '@/features/ideas/model/idea.types';

import { api } from '@/shared/api/http';

export async function fetchIdeas(
  params?: IdeasListParams,
): Promise<IdeasListResponse> {
  const { data } = await api.get<IdeasListResponse>(IDEAS_ROUTES.root, {
    params,
  });
  return data;
}

export async function fetchIdeaById(ideaId: string): Promise<IdeaApi> {
  const { data } = await api.get<IdeaApi>(IDEAS_ROUTES.byId(ideaId));
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

export async function publishIdea(
  ideaId: string,
  payload: PublishIdeaPayload,
): Promise<IdeaApi> {
  const { data } = await api.post<IdeaApi>(
    IDEAS_ROUTES.publish(ideaId),
    payload,
  );
  return data;
}

export async function deleteIdea(ideaId: string): Promise<void> {
  await api.delete(IDEAS_ROUTES.byId(ideaId));
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

  const { data } = await api.put<IdeaApi>(IDEAS_ROUTES.mainImage(ideaId), body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteIdeaMedia(
  ideaId: string,
  mediaId: string,
): Promise<void> {
  await api.delete(IDEAS_ROUTES.mediaById(ideaId, mediaId));
}

export type {
  CreateIdeaPayload,
  IdeasListParams,
  IdeasListResponse,
  PublishIdeaPayload,
  SaveIdeaDraftPayload,
  UpdateIdeaPayload,
  UploadIdeaMediaPayload,
} from '@/features/ideas/api/ideas-api.types';
