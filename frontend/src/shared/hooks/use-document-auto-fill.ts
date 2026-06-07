import type { IdeaCreateFormValues } from '@/features/ideas/lib/create-idea';
import type { SubmitProblemFormValues } from '@/features/problems/lib/submit-problem';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { extractDocumentFields } from '@/shared/api/ai/document-extract.api';
import type { DocumentExtractMeta } from '@/shared/api/ai/document-extract-api.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import {
  applyDocumentExtractAndAttach,
  type DocumentAutoFillEntityType,
  type DocumentAutoFillFormByEntity,
  hasDocumentAutoFillContent,
  hasDocumentExtractedContent,
  validateAutoFillDocument,
} from '@/shared/lib/document-auto-fill';

type UseDocumentAutoFillParams =
  | {
      entityType: 'idea';
      form: UseFormReturn<IdeaCreateFormValues>;
    }
  | {
      entityType: 'problem';
      form: UseFormReturn<SubmitProblemFormValues>;
    };

function notifyExtractResult(
  hasExtractedContent: boolean,
  meta: DocumentExtractMeta,
): void {
  if (hasExtractedContent) {
    toast.success('Form fields populated from document');
  } else {
    toast.warning('Document attached, but no fields could be extracted');
  }

  if (meta.documentTextTruncated) {
    toast.warning(
      'Only the first part of this document was analyzed. Content near the end may have been skipped.',
    );
  }
}

async function finishExtractScan(
  entityType: 'idea',
  form: UseFormReturn<IdeaCreateFormValues>,
  file: File,
): Promise<void>;
async function finishExtractScan(
  entityType: 'problem',
  form: UseFormReturn<SubmitProblemFormValues>,
  file: File,
): Promise<void>;
async function finishExtractScan(
  entityType: DocumentAutoFillEntityType,
  form: DocumentAutoFillFormByEntity[DocumentAutoFillEntityType],
  file: File,
): Promise<void> {
  const { data: extracted, meta } = await extractDocumentFields(
    file,
    entityType,
  );

  applyDocumentExtractAndAttach(entityType, form, extracted, file);

  notifyExtractResult(hasDocumentExtractedContent(entityType, extracted), meta);
}

function hasExistingAutoFillContent(
  params: UseDocumentAutoFillParams,
): boolean {
  if (params.entityType === 'idea') {
    return hasDocumentAutoFillContent(
      params.entityType,
      params.form.getValues(),
    );
  }

  return hasDocumentAutoFillContent(params.entityType, params.form.getValues());
}

async function runExtractScan(
  params: UseDocumentAutoFillParams,
  file: File,
): Promise<void> {
  if (params.entityType === 'idea') {
    await finishExtractScan(params.entityType, params.form, file);
    return;
  }

  await finishExtractScan(params.entityType, params.form, file);
}

export function useDocumentAutoFill(params: UseDocumentAutoFillParams) {
  const [isScanning, setIsScanning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingFileRef = useRef<File | null>(null);

  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const runScan = useCallback(async (file: File) => {
    setIsScanning(true);
    try {
      await runExtractScan(paramsRef.current, file);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsScanning(false);
      pendingFileRef.current = null;
    }
  }, []);

  const handleFileSelected = useCallback(
    (file: File) => {
      const validationError = validateAutoFillDocument(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (hasExistingAutoFillContent(paramsRef.current)) {
        pendingFileRef.current = file;
        setConfirmOpen(true);
        return;
      }

      void runScan(file);
    },
    [runScan],
  );

  const handleConfirmOverwrite = useCallback(() => {
    const file = pendingFileRef.current;
    setConfirmOpen(false);
    if (!file) return;
    void runScan(file);
  }, [runScan]);

  const handleCancelOverwrite = useCallback(() => {
    pendingFileRef.current = null;
    setConfirmOpen(false);
  }, []);

  const handleConfirmOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancelOverwrite();
        return;
      }
      setConfirmOpen(true);
    },
    [handleCancelOverwrite],
  );

  return {
    isScanning,
    handleFileSelected,
    confirmModalProps: {
      open: confirmOpen,
      onOpenChange: handleConfirmOpenChange,
      title: 'Replace existing content?',
      description:
        'Uploading a document will replace your current field values with AI-extracted content. Do you want to continue?',
      confirmLabel: 'Continue',
      cancelLabel: 'Cancel',
      onConfirm: handleConfirmOverwrite,
      onCancel: handleCancelOverwrite,
      isPending: isScanning,
    },
  };
}

export type { DocumentAutoFillEntityType };
