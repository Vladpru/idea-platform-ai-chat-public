import { getAttachmentFileKey } from '@/features/ideas/lib/create-idea/attachments';
import { parseTags } from '@/features/ideas/lib/create-idea/tags';

import type { IdeaEditFormValues } from './schema';

function tagSetKey(tags: string | undefined): string {
  return parseTags(tags)
    .map(tag => tag.toLowerCase())
    .sort()
    .join('\0');
}

function fileFingerprint(file: File): string {
  return getAttachmentFileKey(file);
}

function normalizeIdeaEditFormValues(values: IdeaEditFormValues) {
  return {
    stage: values.stage,
    title: values.title.trim(),
    description: values.description.trim(),
    tags: tagSetKey(values.tags),
    existingMainImageId: values.existingMainImage?.id ?? null,
    removeMainImage: values.removeMainImage,
    mainImageFingerprint: values.mainImage ? fileFingerprint(values.mainImage) : null,
    removedAttachmentIds: [...values.removedAttachmentIds].sort().join('\0'),
    newFileFingerprints: (values.newFiles ?? [])
      .map(fileFingerprint)
      .sort()
      .join('\0'),
  };
}

export function areIdeaEditFormValuesEqual(
  current: IdeaEditFormValues,
  initial: IdeaEditFormValues,
): boolean {
  const left = normalizeIdeaEditFormValues(current);
  const right = normalizeIdeaEditFormValues(initial);

  return (
    left.stage === right.stage &&
    left.title === right.title &&
    left.description === right.description &&
    left.tags === right.tags &&
    left.existingMainImageId === right.existingMainImageId &&
    left.removeMainImage === right.removeMainImage &&
    left.mainImageFingerprint === right.mainImageFingerprint &&
    left.removedAttachmentIds === right.removedAttachmentIds &&
    left.newFileFingerprints === right.newFileFingerprints
  );
}
