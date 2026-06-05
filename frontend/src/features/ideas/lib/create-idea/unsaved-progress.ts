import type { IdeaMediaItem } from '@/features/ideas/model/idea.types';

import { EMPTY_CREATE_IDEA_DRAFT } from './defaults';
import { parseProblemIds } from '../problems';
import type { IdeaCreateFormValues } from './schema';
import { parseTags } from './tags';

export function hasCreateIdeaUnsavedProgress(
  formIsDirty: boolean,
  values: IdeaCreateFormValues,
  remoteMedia: IdeaMediaItem[],
  isEditing = false,
): boolean {
  if (formIsDirty) {
    return true;
  }

  if (isEditing) {
    return false;
  }

  if (values.title.trim() || values.description.trim()) {
    return true;
  }

  if (
    parseProblemIds(values.problemId).length > 0 ||
    parseTags(values.tags).length > 0
  ) {
    return true;
  }

  if (values.mainImage || (values.files?.length ?? 0) > 0) {
    return true;
  }

  if (remoteMedia.length > 0) {
    return true;
  }

  if (values.stage !== EMPTY_CREATE_IDEA_DRAFT.stage) {
    return true;
  }

  return false;
}
