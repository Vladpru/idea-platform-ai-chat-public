export const MAX_ATTACHMENT_FILES = 10;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const ATTACHMENT_ACCEPT =
  'image/*,.pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function isImageAttachment(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isDocumentAttachment(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return (
    file.type === 'application/pdf' ||
    extension === 'pdf' ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'docx'
  );
}

export function isAllowedAttachment(file: File): boolean {
  return isImageAttachment(file) || isDocumentAttachment(file);
}

export function validateAttachmentFile(file: File): string | null {
  if (!isAllowedAttachment(file)) {
    return 'Only images, PDF, and DOCX files are allowed';
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return 'Each file must be 5 MB or less';
  }
  return null;
}

export function getAttachmentFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function mergeAttachmentFiles(
  existing: File[],
  incoming: File[],
  maxCount: number = MAX_ATTACHMENT_FILES,
): { merged: File[]; errors: string[] } {
  const errors: string[] = [];
  const merged = [...existing];
  const existingKeys = new Set(existing.map(getAttachmentFileKey));

  for (const file of incoming) {
    if (merged.length >= maxCount) {
      errors.push(`You can add up to ${maxCount} file${maxCount === 1 ? '' : 's'}`);
      break;
    }

    const validationError = validateAttachmentFile(file);
    if (validationError) {
      errors.push(`${file.name}: ${validationError}`);
      continue;
    }

    const key = getAttachmentFileKey(file);
    if (existingKeys.has(key)) {
      continue;
    }

    existingKeys.add(key);
    merged.push(file);
  }

  return { merged, errors };
}
