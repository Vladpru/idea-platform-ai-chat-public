import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import {
  deleteIdeaMedia,
  fetchIdeaFormById,
  updateIdea,
  updatePublishedIdea,
  uploadIdeaMainImage,
  uploadIdeaMedia,
} from '@/features/ideas/api/ideas.api';
import type { UpdateIdeaPayload } from '@/features/ideas/api/ideas-api.types';
import { editFormValuesToPayload } from '@/features/ideas/lib/edit-idea/mappers';
import type { IdeaEditFormValues } from '@/features/ideas/lib/edit-idea/schema';
import { IDEA_STATUS, type IdeaStatus } from '@/features/ideas/model/idea.types';

export async function applyEditMediaChanges(
  ideaId: string,
  values: IdeaEditFormValues,
): Promise<void> {
  if (values.mainImage) {
    await uploadIdeaMainImage(ideaId, values.mainImage);
  } else if (values.removeMainImage && values.existingMainImage?.id) {
    await deleteIdeaMedia(ideaId, values.existingMainImage.id);
  }

  const removedIds = new Set(values.removedAttachmentIds);
  for (const attachment of values.existingAttachments) {
    if (removedIds.has(attachment.id)) {
      await deleteIdeaMedia(ideaId, attachment.id);
    }
  }

  const newFiles = values.newFiles ?? [];
  if (newFiles.length > 0) {
    await Promise.all(
      newFiles.map(file => uploadIdeaMedia(ideaId, { file, kind: 'attachment' })),
    );
  }
}

async function updateIdeaMetadata(
  ideaId: string,
  status: IdeaStatus,
  payload: UpdateIdeaPayload,
): Promise<void> {
  if (status === IDEA_STATUS.PUBLISHED) {
    await updatePublishedIdea(ideaId, payload);
  } else {
    await updateIdea(ideaId, payload);
  }
}

export async function saveEditedIdea(
  ideaId: string,
  status: IdeaStatus,
  values: IdeaEditFormValues,
): Promise<IdeaFormResponseDto> {
  const payload = editFormValuesToPayload(values);
  await updateIdeaMetadata(ideaId, status, payload);
  await applyEditMediaChanges(ideaId, values);
  return fetchIdeaFormById(ideaId);
}
