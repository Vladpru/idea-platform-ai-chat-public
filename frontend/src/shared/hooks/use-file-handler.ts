'use client';

import {
  getFileKey,
  mergeFiles,
  validateFile,
} from '@/shared/lib/file-validation';
import { useCallback, useState, type ChangeEvent } from 'react';
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

export function useFileHandler({
  maxFiles,
  allowedMimeTypes,
  maxBytes,
  accept,
  allowedMessage,
  validateAllowed,
  files: externalFiles,
  onFilesChange,
  onValidationError,
}: UseFileHandlerOptions) {
  const [internalFiles, setInternalFiles] = useState<File[]>([]);

  const files = externalFiles ?? internalFiles;
  const setFiles = onFilesChange ?? setInternalFiles;

  const validate = useCallback(
    (file: File) =>
      validateFile(file, {
        allowedMimeTypes,
        maxBytes,
        validateAllowed,
        allowedMessage,
      }),
    [allowedMimeTypes, maxBytes, validateAllowed, allowedMessage],
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) {
        return;
      }

      const { merged, errors } = mergeFiles(files, incoming, {
        maxCount: maxFiles,
        validate,
      });

      if (errors.length > 0) {
        const uniqueErrors = Array.from(new Set(errors));

        if (onValidationError) {
          onValidationError(uniqueErrors.join('\n'));
        } else {
          if (uniqueErrors.length > 3) {
            const displayed = uniqueErrors.slice(0, 3).join('\n');
            toast.error(
              `${displayed}\n...and ${uniqueErrors.length - 3} more errors`,
            );
          } else {
            toast.error(uniqueErrors.join('\n'));
          }
        }
      }

      if (merged.length !== files.length) {
        setFiles(merged);
      }
    },
    [files, maxFiles, onValidationError, setFiles, validate],
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

  const atLimit = files.length >= maxFiles;

  return {
    files,
    handleFileChange,
    removeFile,
    clearFiles,
    addFiles,
    atLimit,
    accept,
    getFileKey,
  };
}
