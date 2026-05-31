'use client';

import { getFileKey, mergeFiles, validateFile } from '@/shared/lib/file-validation';
import {
  useCallback,
  useState,
  type ChangeEvent,
} from 'react';
import { toast } from 'sonner';

export type UseFileHandlerOptions = {
  maxFiles: number;
  allowedMimeTypes: string[];
  maxBytes?: number;
  accept?: string;
  allowedMessage?: string;
  validateAllowed?: (file: File) => boolean;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  onValidationError?: (message: string) => void;
};

export function useFileHandler(options: UseFileHandlerOptions) {
  const [internalFiles, setInternalFiles] = useState<File[]>([]);

  const files = options.files ?? internalFiles;
  const setFiles = options.onFilesChange ?? setInternalFiles;

  const reportError = useCallback(
    (message: string) => {
      if (options.onValidationError) {
        options.onValidationError(message);
        return;
      }
      toast.error(message);
    },
    [options],
  );

  const validate = useCallback(
    (file: File) =>
      validateFile(file, {
        allowedMimeTypes: options.allowedMimeTypes,
        maxBytes: options.maxBytes,
        validateAllowed: options.validateAllowed,
        allowedMessage: options.allowedMessage,
      }),
    [options],
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) {
        return;
      }

      const { merged, errors } = mergeFiles(files, incoming, {
        maxCount: options.maxFiles,
        validate,
      });

      errors.forEach(reportError);

      if (merged.length !== files.length) {
        setFiles(merged);
      }
    },
    [files, options.maxFiles, reportError, setFiles, validate],
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const incoming = Array.from(event.target.files ?? []);
      addFiles(incoming);
      event.target.value = '';
    },
    [addFiles],
  );

  const removeFile = useCallback(
    (key: string) => {
      setFiles(files.filter(file => getFileKey(file) !== key));
    },
    [files, setFiles],
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, [setFiles]);

  const atLimit = files.length >= options.maxFiles;

  return {
    files,
    handleFileChange,
    removeFile,
    clearFiles,
    addFiles,
    atLimit,
    accept: options.accept,
    getFileKey,
  };
}
