export const DOCUMENT_EXTRACT_DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const DOCUMENT_EXTRACT_PDF_MIME = 'application/pdf';

export function resolveDocumentExtractMimeType(
  mimeType: string,
  originalFilename?: string,
): string | null {
  const normalizedMime = mimeType.trim().toLowerCase();
  if (
    normalizedMime === DOCUMENT_EXTRACT_DOCX_MIME ||
    normalizedMime === DOCUMENT_EXTRACT_PDF_MIME
  ) {
    return normalizedMime;
  }

  const extension = originalFilename?.split('.').pop()?.toLowerCase();
  if (extension === 'docx') return DOCUMENT_EXTRACT_DOCX_MIME;
  if (extension === 'pdf') return DOCUMENT_EXTRACT_PDF_MIME;

  return null;
}

export function isAllowedDocumentExtractFile(
  file: Pick<Express.Multer.File, 'mimetype' | 'originalname'>,
): boolean {
  return resolveDocumentExtractMimeType(file.mimetype, file.originalname) !== null;
}
