import type {
  DocumentExtractEntityType,
  DocumentExtractResponse,
} from '@/shared/api/ai/document-extract-api.types';
import { AI_ROUTES } from '@/shared/api/ai/ai.routes';

import { api } from '@/shared/api/http';

export async function extractDocumentFields(
  file: File,
  entityType: DocumentExtractEntityType,
): Promise<DocumentExtractResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', entityType);

  const { data } = await api.post<{ data: DocumentExtractResponse }>(
    AI_ROUTES.documentExtract,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return data.data;
}
