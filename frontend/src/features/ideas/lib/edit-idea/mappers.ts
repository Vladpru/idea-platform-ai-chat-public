import type { IdeaFormResponseDto } from '@/features/ideas/api/idea-form-api.types';
import type { IdeaDetails } from '@/features/idea-details/model/idea-details.types';
import type { UpdateIdeaPayload } from '@/features/ideas/api/ideas-api.types';
import type { ApiStage } from '@/features/ideas/model/idea.types';
import { formatTags, parseTags } from '@/features/ideas/lib/create-idea/tags';
import type { IdeaEditFormValues } from '@/features/ideas/lib/edit-idea/schema';
import { ideaEditDefaultValues } from '@/features/ideas/lib/edit-idea/schema';
import {
  apiStageToFormStage,
  formStageToApiStage,
} from '@/features/ideas/lib/stages';

export function ideaFormDtoToEditFormValues(
  dto: IdeaFormResponseDto,
): IdeaEditFormValues {
  return {
    stage:
      apiStageToFormStage(dto.stage as ApiStage | null) ??
      ideaEditDefaultValues.stage,
    title: dto.title?.trim() ?? '',
    description: dto.description?.trim() ?? '',
    tags: formatTags(dto.tags.map(tag => tag.name)),
    existingMainImage: dto.mainImage
      ? { id: dto.mainImage.id, url: dto.mainImage.url }
      : null,
    removeMainImage: false,
    existingAttachments: dto.attachments.map(attachment => ({
      id: attachment.id,
      url: attachment.url,
      filename: attachment.originalFilename,
    })),
    removedAttachmentIds: [],
    newFiles: [],
  };
}

export function ideaDetailsToEditFormValues(idea: IdeaDetails): IdeaEditFormValues {
  return {
    stage:
      apiStageToFormStage(idea.stageValue) ?? ideaEditDefaultValues.stage,
    title: idea.title.trim(),
    description: idea.description.trim(),
    tags: formatTags(idea.tags),
    existingMainImage: idea.mainImage,
    removeMainImage: false,
    existingAttachments: idea.attachments.map(attachment => ({
      id: attachment.id,
      url: attachment.url,
      filename: attachment.filename,
    })),
    removedAttachmentIds: [],
    newFiles: [],
  };
}

export function editFormValuesToPayload(
  values: IdeaEditFormValues,
): UpdateIdeaPayload {
  return {
    stage: formStageToApiStage(values.stage),
    title: values.title.trim(),
    description: values.description.trim(),
    tagLabels: parseTags(values.tags),
  };
}
