import type { SaveIdeaDraftPayload } from '@/features/ideas/api/ideas-api.types';
import type {
  CreateIdeaDraft,
  CreateIdeaLocalFiles,
  IdeaApi,
  IdeaMediaItem,
} from '@/features/ideas/model/idea.types';

import { formatProblemIds, parseProblemIds } from '../problems';
import { apiStageToFormStage, formStageToApiStage } from '../stages';
import { formatTags, parseTags } from './tags';
import type { IdeaCreateFormValues } from './schema';

export function ideaApiToDraft(idea: IdeaApi): CreateIdeaDraft {
  return {
    id: idea.id,
    authorId: idea.authorId,
    status: idea.status,
    stage: apiStageToFormStage(idea.stage),
    title: idea.title ?? '',
    description: idea.description ?? '',
    problemIds: idea.problems?.map(link => link.problemId) ?? [],
    tags: idea.tags?.map(link => link.label ?? link.tagId) ?? [],
    publishedAt: idea.publishedAt,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  };
}

export function ideaApiToRemoteMedia(idea: IdeaApi): IdeaMediaItem[] {
  return idea.media ?? [];
}

export function draftToFormValues(
  draft: CreateIdeaDraft,
  localFiles: CreateIdeaLocalFiles,
): IdeaCreateFormValues {
  return {
    stage: draft.stage ?? 'ideation',
    problemId: formatProblemIds(draft.problemIds),
    title: draft.title,
    description: draft.description,
    tags: formatTags(draft.tags),
    mainImage: localFiles.mainImage ?? undefined,
    files: localFiles.attachments,
  };
}

export function formValuesToDraftPatch(
  values: IdeaCreateFormValues,
): Pick<CreateIdeaDraft, 'stage' | 'title' | 'description' | 'problemIds' | 'tags'> {
  return {
    stage: values.stage,
    title: values.title,
    description: values.description,
    problemIds: parseProblemIds(values.problemId),
    tags: parseTags(values.tags),
  };
}

export function formValuesToLocalFiles(
  values: IdeaCreateFormValues,
): CreateIdeaLocalFiles {
  return {
    mainImage: values.mainImage ?? null,
    attachments: values.files ?? [],
  };
}

export function formValuesToSavePayload(
  values: IdeaCreateFormValues,
): SaveIdeaDraftPayload {
  return {
    stage: formStageToApiStage(values.stage),
    title: values.title.trim() || null,
    description: values.description.trim() || null,
    problemIds: parseProblemIds(values.problemId),
    tagLabels: parseTags(values.tags),
  };
}
