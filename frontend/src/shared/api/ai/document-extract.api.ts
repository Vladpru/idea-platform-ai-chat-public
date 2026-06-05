import type {
  DocumentExtractEntityType,
  DocumentExtractResult,
  IdeaDocumentExtractResult,
  ProblemDocumentExtractResult,
} from '@/shared/api/ai/document-extract-api.types';
import { AI_ROUTES } from '@/shared/api/ai/ai.routes';

import { api } from '@/shared/api/http';

export function extractDocumentFields(
  file: File,
  entityType: 'idea',
): Promise<IdeaDocumentExtractResult>;
export function extractDocumentFields(
  file: File,
  entityType: 'problem',
): Promise<ProblemDocumentExtractResult>;
export function extractDocumentFields(
  file: File,
  entityType: DocumentExtractEntityType,
): Promise<DocumentExtractResult>;
export async function extractDocumentFields(
  file: File,
  entityType: DocumentExtractEntityType,
): Promise<DocumentExtractResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', entityType);

  const { data } = await api.post<DocumentExtractResult>(
    AI_ROUTES.documentExtract,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return data;
}
