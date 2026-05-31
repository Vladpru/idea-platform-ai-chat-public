export const MAX_COMMENT_ATTACHMENTS = 5;

export const COMMENT_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const COMMENT_ATTACHMENT_ACCEPT = COMMENT_ATTACHMENT_MIME_TYPES.join(',');

export const COMMENT_ATTACHMENT_ALLOWED_MESSAGE =
  'Only images, PDF, and Word documents are allowed';
