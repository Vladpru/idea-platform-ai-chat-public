import type { IdeaEditFormValues } from '@/features/ideas/lib/edit-idea';
import DeleteImageButton from '@/features/ideas/ui/create-idea/DeleteImageButton';
import { FieldError, FieldLabel } from '@/features/ideas/ui/create-idea/Fields';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  Control,
  UseFormSetError,
  UseFormClearErrors,
} from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';

import { cn } from '@/shared/lib/utils';

const ALLOWED_MAIN_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const INVALID_MAIN_IMAGE_TYPE_MESSAGE = 'Main image must be PNG, JPEG, or WEBP';

type IdeaEditMainImageFieldProps = {
  control: Control<IdeaEditFormValues>;
  setValue: (
    name: 'removeMainImage' | 'mainImage' | 'existingMainImage',
    value:
      | IdeaEditFormValues['removeMainImage']
      | IdeaEditFormValues['mainImage']
      | IdeaEditFormValues['existingMainImage'],
    options?: { shouldDirty?: boolean; shouldValidate?: boolean },
  ) => void;
  setError: UseFormSetError<IdeaEditFormValues>;
  clearErrors: UseFormClearErrors<IdeaEditFormValues>;
  errorMessage?: string;
  disabled?: boolean;
  formId: string;
};

export function IdeaEditMainImageField({
  control,
  setValue,
  setError,
  clearErrors,
  errorMessage,
  disabled = false,
  formId,
}: IdeaEditMainImageFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const existingMainImage = useWatch({ control, name: 'existingMainImage' });
  const removeMainImage = useWatch({ control, name: 'removeMainImage' });
  const mainImage = useWatch({ control, name: 'mainImage' });

  const remoteImageUrl =
    existingMainImage && !removeMainImage ? existingMainImage.url : null;
  const displayImageUrl = previewUrl ?? remoteImageUrl;

  useEffect(() => {
    if (!mainImage) {
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const url = URL.createObjectURL(mainImage);
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    return () => URL.revokeObjectURL(url);
  }, [mainImage]);

  const clearMainImage = () => {
    setValue('mainImage', undefined, { shouldDirty: true });
    setValue('removeMainImage', true, { shouldDirty: true });
    clearErrors('mainImage');
  };

  const setMainImageFile = (file: File) => {
    setValue('mainImage', file, { shouldDirty: true, shouldValidate: true });
    setValue('removeMainImage', false, { shouldDirty: true });
    clearErrors('mainImage');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/png': [],
      'image/jpeg': [],
      'image/webp': [],
    },
    maxFiles: 1,
    disabled,
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (!ALLOWED_MAIN_IMAGE_TYPES.includes(file.type)) {
        setError('mainImage', {
          type: 'manual',
          message: INVALID_MAIN_IMAGE_TYPE_MESSAGE,
        });
        return;
      }
      setMainImageFile(file);
    },
    onDropRejected: () => {
      setError('mainImage', {
        type: 'manual',
        message: INVALID_MAIN_IMAGE_TYPE_MESSAGE,
      });
    },
  });

  return (
    <Controller
      name="mainImage"
      control={control}
      render={() => (
        <>
          <FieldLabel required hint="This will be the main image for your idea">
            Main image
          </FieldLabel>
          <div
            {...getRootProps()}
            className={cn(
              'border-brand-gray-200 hover:border-brand-dark-blue/40 focus-visible:ring-ring bg-card mt-2 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-4 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              isDragActive && 'border-brand-dark-blue bg-brand-gray-100',
              errorMessage && 'border-destructive',
              disabled && 'cursor-not-allowed opacity-50',
              displayImageUrl && 'relative overflow-hidden p-0',
            )}
          >
            <input
              {...getInputProps()}
              id={`${formId}-main-image`}
              aria-invalid={!!errorMessage}
            />
            {displayImageUrl ? (
              <>
                <img
                  src={displayImageUrl}
                  alt="Idea main image preview"
                  className="max-h-80 w-full rounded object-contain p-2"
                />
                <DeleteImageButton
                  onClick={event => {
                    event.stopPropagation();
                    clearMainImage();
                  }}
                  isBusy={disabled}
                />
              </>
            ) : (
              <>
                <Upload
                  className="text-brand-gray-400 mb-3 size-10"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <p className="text-brand-gray-700 text-sm font-medium">
                  Choose or drag and drop an image
                </p>
              </>
            )}
          </div>
          <FieldError message={errorMessage} />
        </>
      )}
    />
  );
}
