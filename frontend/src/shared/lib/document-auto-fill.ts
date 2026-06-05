import type { IdeaCreateFormValues } from '@/features/ideas/lib/create-idea';
import { mergeAttachmentFiles } from '@/features/ideas/lib/create-idea/attachments';
import { sanitizeCostBenefitInput } from '@/features/problems/lib/submit-problem/cost-benefit';
import type { SubmitProblemFormValues } from '@/features/problems/lib/submit-problem';
import type {
  DocumentExtractDataByEntity,
  DocumentExtractEntityType,
  IdeaDocumentExtractResponse,
  ProblemDocumentExtractResponse,
} from '@/shared/api/ai/document-extract-api.types';
import type { UseFormReturn } from 'react-hook-form';

import { DEFAULT_MAX_FILE_BYTES, validateFile } from '@/shared/lib/file-validation';

export const AUTO_FILL_ACCEPT =
  '.docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const AUTO_FILL_ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
] as const;

export const AUTO_FILL_UNSUPPORTED_MESSAGE =
  'Only .docx and .pdf files are supported for AI auto-fill';

export function isAutoFillDocument(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return (
    AUTO_FILL_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof AUTO_FILL_ALLOWED_MIME_TYPES)[number],
    ) ||
    extension === 'docx' ||
    extension === 'pdf'
  );
}

export function validateAutoFillDocument(file: File): string | null {
  return validateFile(file, {
    allowedMimeTypes: [...AUTO_FILL_ALLOWED_MIME_TYPES],
    maxBytes: DEFAULT_MAX_FILE_BYTES,
    validateAllowed: isAutoFillDocument,
    allowedMessage: AUTO_FILL_UNSUPPORTED_MESSAGE,
  });
}

export function hasIdeaAutoFillContent(values: IdeaCreateFormValues): boolean {
  return Boolean(
    values.title.trim() || values.description.trim() || values.tags?.trim(),
  );
}

export function hasProblemAutoFillContent(
  values: SubmitProblemFormValues,
): boolean {
  return Boolean(
    values.title.trim() ||
      values.description?.trim() ||
      values.valueProposition?.trim() ||
      values.costBenefit?.trim() ||
      values.tags?.trim(),
  );
}

export function hasIdeaExtractedContent(
  extracted: IdeaDocumentExtractResponse,
): boolean {
  return Boolean(
    extracted.title.trim() ||
      extracted.description.trim() ||
      extracted.tags.some(Boolean),
  );
}

export function hasProblemExtractedContent(
  extracted: ProblemDocumentExtractResponse,
): boolean {
  return Boolean(
    extracted.title.trim() ||
      extracted.description.trim() ||
      extracted.valueProposition.trim() ||
      extracted.costBenefit.trim() ||
      extracted.tags.some(Boolean),
  );
}

const setFieldOptions = {
  shouldDirty: true,
  shouldValidate: true,
} as const;

export function applyIdeaExtractedFields(
  form: UseFormReturn<IdeaCreateFormValues>,
  extracted: IdeaDocumentExtractResponse,
): void {
  if (extracted.title.trim()) {
    form.setValue('title', extracted.title.trim(), setFieldOptions);
  }
  if (extracted.description.trim()) {
    form.setValue('description', extracted.description.trim(), setFieldOptions);
  }
  const tags = extracted.tags.filter(Boolean).join(', ');
  if (tags) {
    form.setValue('tags', tags, setFieldOptions);
  }
}

export function applyProblemExtractedFields(
  form: UseFormReturn<SubmitProblemFormValues>,
  extracted: ProblemDocumentExtractResponse,
): void {
  if (extracted.title.trim()) {
    form.setValue('title', extracted.title.trim(), setFieldOptions);
  }
  if (extracted.description.trim()) {
    form.setValue('description', extracted.description.trim(), setFieldOptions);
  }
  if (extracted.valueProposition.trim()) {
    form.setValue(
      'valueProposition',
      extracted.valueProposition.trim(),
      setFieldOptions,
    );
  }
  if (extracted.costBenefit.trim()) {
    form.setValue(
      'costBenefit',
      sanitizeCostBenefitInput(extracted.costBenefit.trim()),
      setFieldOptions,
    );
  }
  const tags = extracted.tags.filter(Boolean).join(', ');
  if (tags) {
    form.setValue('tags', tags, setFieldOptions);
  }
}

export function appendDocumentToFiles(
  existingFiles: File[] | undefined,
  file: File,
): File[] {
  const { merged } = mergeAttachmentFiles(existingFiles ?? [], [file]);
  return merged;
}

export const documentAutoFillHandlers = {
  idea: {
    applyExtractedFields: applyIdeaExtractedFields,
    hasExtractedContent: hasIdeaExtractedContent,
    hasAutoFillContent: hasIdeaAutoFillContent,
  },
  problem: {
    applyExtractedFields: applyProblemExtractedFields,
    hasExtractedContent: hasProblemExtractedContent,
    hasAutoFillContent: hasProblemAutoFillContent,
  },
} as const;

export type DocumentAutoFillFormByEntity = {
  idea: UseFormReturn<IdeaCreateFormValues>;
  problem: UseFormReturn<SubmitProblemFormValues>;
};

export function applyDocumentExtractAndAttach<T extends DocumentAutoFillEntityType>(
  entityType: T,
  form: DocumentAutoFillFormByEntity[T],
  extracted: DocumentExtractDataByEntity[T],
  file: File,
): void {
  if (entityType === 'idea') {
    documentAutoFillHandlers.idea.applyExtractedFields(
      form as DocumentAutoFillFormByEntity['idea'],
      extracted as IdeaDocumentExtractResponse,
    );
  } else {
    documentAutoFillHandlers.problem.applyExtractedFields(
      form as DocumentAutoFillFormByEntity['problem'],
      extracted as ProblemDocumentExtractResponse,
    );
  }

  attachDocumentToForm(
    form as unknown as UseFormReturn<{ files?: File[] }>,
    file,
  );
}

function attachDocumentToForm(
  form: UseFormReturn<{ files?: File[] }>,
  file: File,
): void {
  form.setValue(
    'files',
    appendDocumentToFiles(form.getValues('files'), file),
    setFieldOptions,
  );
}

export function hasDocumentExtractedContent<T extends DocumentAutoFillEntityType>(
  entityType: T,
  extracted: DocumentExtractDataByEntity[T],
): boolean {
  if (entityType === 'idea') {
    return documentAutoFillHandlers.idea.hasExtractedContent(
      extracted as IdeaDocumentExtractResponse,
    );
  }

  return documentAutoFillHandlers.problem.hasExtractedContent(
    extracted as ProblemDocumentExtractResponse,
  );
}

export function hasDocumentAutoFillContent<T extends DocumentAutoFillEntityType>(
  entityType: T,
  values: T extends 'idea' ? IdeaCreateFormValues : SubmitProblemFormValues,
): boolean {
  if (entityType === 'idea') {
    return documentAutoFillHandlers.idea.hasAutoFillContent(
      values as IdeaCreateFormValues,
    );
  }

  return documentAutoFillHandlers.problem.hasAutoFillContent(
    values as SubmitProblemFormValues,
  );
}

export type DocumentAutoFillEntityType = DocumentExtractEntityType;
