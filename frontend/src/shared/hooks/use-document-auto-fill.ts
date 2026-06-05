import type { IdeaCreateFormValues } from '@/features/ideas/lib/create-idea';
import type { SubmitProblemFormValues } from '@/features/problems/lib/submit-problem';
import { useCallback, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { extractDocumentFields } from '@/shared/api/ai/document-extract.api';
import type {
  IdeaDocumentExtractResponse,
  ProblemDocumentExtractResponse,
} from '@/shared/api/ai/document-extract-api.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import {
  appendDocumentToFiles,
  applyIdeaExtractedFields,
  applyProblemExtractedFields,
  type DocumentAutoFillEntityType,
  hasIdeaAutoFillContent,
  hasProblemAutoFillContent,
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

export function useDocumentAutoFill(params: UseDocumentAutoFillParams) {
  const { entityType, form } = params;
  const [isScanning, setIsScanning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingFileRef = useRef<File | null>(null);

  const runScan = useCallback(
    async (file: File) => {
      setIsScanning(true);
      try {
        const extracted = await extractDocumentFields(file, entityType);

        if (entityType === 'idea') {
          const ideaForm = form as UseFormReturn<IdeaCreateFormValues>;
          applyIdeaExtractedFields(
            ideaForm,
            extracted as IdeaDocumentExtractResponse,
          );
          const currentFiles = ideaForm.getValues('files');
          ideaForm.setValue(
            'files',
            appendDocumentToFiles(currentFiles, file),
            {
              shouldDirty: true,
              shouldValidate: true,
            },
          );
        } else {
          const problemForm = form as UseFormReturn<SubmitProblemFormValues>;
          applyProblemExtractedFields(
            problemForm,
            extracted as ProblemDocumentExtractResponse,
          );
          const currentFiles = problemForm.getValues('files');
          problemForm.setValue(
            'files',
            appendDocumentToFiles(currentFiles, file),
            {
              shouldDirty: true,
              shouldValidate: true,
            },
          );
        }

        toast.success('Form fields populated from document');
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setIsScanning(false);
        pendingFileRef.current = null;
      }
    },
    [entityType, form],
  );

  const handleFileSelected = useCallback(
    (file: File) => {
      const validationError = validateAutoFillDocument(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const values = form.getValues();
      const hasExistingContent =
        entityType === 'idea'
          ? hasIdeaAutoFillContent(values as IdeaCreateFormValues)
          : hasProblemAutoFillContent(values as SubmitProblemFormValues);

      if (hasExistingContent) {
        pendingFileRef.current = file;
        setConfirmOpen(true);
        return;
      }

      void runScan(file);
    },
    [entityType, form, runScan],
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
