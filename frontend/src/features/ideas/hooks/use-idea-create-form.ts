import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';

import {
  type IdeaCreateFormValues,
  ideaCreateDefaultValues,
  ideaCreateDraftSchema,
  ideaCreateSchema,
} from '../lib/idea-create-schema';

export function useIdeaCreateForm() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const form = useForm<IdeaCreateFormValues>({
    resolver: zodResolver(ideaCreateSchema) as Resolver<IdeaCreateFormValues>,
    defaultValues: ideaCreateDefaultValues,
    mode: 'onChange',
  });

  const setMainImage = useCallback(
    (file: File | null) => {
      setImagePreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return file ? URL.createObjectURL(file) : null;
      });
      form.setValue('mainImage', file as File, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [form],
  );

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const onSaveDraft = () => {
    const result = ideaCreateDraftSchema.safeParse(form.getValues());
    if (!result.success) return;
    // TODO: wire draft API with result.data
  };

  const onPublish = form.handleSubmit(_values => {
    // TODO: wire publish API
    return _values;
  });

  return {
    form,
    imageInputRef,
    imagePreviewUrl,
    isDraggingImage,
    setIsDraggingImage,
    setMainImage,
    onSaveDraft,
    onPublish,
    canPublish: form.formState.isValid,
  };
}
