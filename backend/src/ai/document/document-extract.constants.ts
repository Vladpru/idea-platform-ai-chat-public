export const DOCUMENT_EXTRACT_MAX_FILE_BYTES = 5 * 1024 * 1024;

export const DOCUMENT_EXTRACT_ALLOWED_MIME_REGEX =
  /application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/;

export const DOCUMENT_EXTRACT_UNSUPPORTED_MESSAGE =
  'Only .docx and .pdf files are supported for AI auto-fill';

export const DOCUMENT_EXTRACT_FILE_TOO_LARGE_MESSAGE =
  'Each file must be 5 MB or less';

export const DOCUMENT_EXTRACT_UNREADABLE_MESSAGE =
  'Could not read this document';

export const DOCUMENT_EXTRACT_PDF_NO_TEXT_MESSAGE =
  'This PDF has no extractable text. Try a text-based PDF or upload a Word document.';

export const DOCUMENT_EXTRACT_MAX_DOCUMENT_TEXT_CHARS = 50_000;
