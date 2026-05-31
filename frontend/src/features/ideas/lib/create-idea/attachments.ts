import {
  DEFAULT_MAX_FILE_BYTES,
  getFileKey,
  isImageFile,
  mergeFiles,
  validateFileSize,
} from '@/shared/lib/file-validation';

export const MAX_ATTACHMENT_FILES = 10;
export const MAX_ATTACHMENT_BYTES = DEFAULT_MAX_FILE_BYTES;

export const ATTACHMENT_ACCEPT =
  'image/*,.pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const IDEA_ATTACHMENT_ALLOWED_MIME_TYPES = [
  'image/*',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export function isImageAttachment(file: File): boolean {
  return isImageFile(file);
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
  return validateFileSize(file, MAX_ATTACHMENT_BYTES);
}

export function getAttachmentFileKey(file: File): string {
  return getFileKey(file);
}

export function mergeAttachmentFiles(
  existing: File[],
  incoming: File[],
  maxCount: number = MAX_ATTACHMENT_FILES,
): { merged: File[]; errors: string[] } {
  return mergeFiles(existing, incoming, {
    maxCount,
    validate: validateAttachmentFile,
    getKey: getAttachmentFileKey,
  });
}
