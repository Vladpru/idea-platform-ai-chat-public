import type {
  CreateIdeaDraft,
  CreateIdeaLocalFiles,
  IdeaMediaItem,
} from '@/features/ideas/model/idea.types';

import { EMPTY_CREATE_IDEA_DRAFT } from './defaults';

type UnsavedProgressDraftState = {
  draft: CreateIdeaDraft;
  localFiles: CreateIdeaLocalFiles;
  remoteMedia: IdeaMediaItem[];
};

export function hasCreateIdeaUnsavedProgress(
  formIsDirty: boolean,
  { draft, localFiles, remoteMedia }: UnsavedProgressDraftState,
  isEditing = false,
): boolean {
  if (formIsDirty) {
    return true;
  }

  if (isEditing) {
    return false;
  }

  if (draft.title.trim() || draft.description.trim()) {
    return true;
  }

  if (draft.problemIds.length > 0 || draft.tags.length > 0) {
    return true;
  }

  if (localFiles.mainImage || localFiles.attachments.length > 0) {
    return true;
  }

  if (remoteMedia.length > 0) {
    return true;
  }

  if (draft.stage !== EMPTY_CREATE_IDEA_DRAFT.stage) {
    return true;
  }

  return false;
}
