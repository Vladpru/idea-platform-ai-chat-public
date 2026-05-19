import { fetchIdeaById } from '@/features/ideas/api/ideas.api';
import { useSaveIdeaDraftMutation } from '@/features/ideas/hooks/use-idea-mutations';
import {
  type IdeaCreateFormValues,
  ideaCreateDraftSchema,
  ideaCreateSchema,
} from '@/features/ideas/lib/idea-create-schema';
import { useCreateIdeaStore } from '@/features/ideas/store/create-idea.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/shared/api/api-error';

export function useIdeaCreateForm() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [hasStoreHydrated, setHasStoreHydrated] = useState(
    () => useCreateIdeaStore.persist.hasHydrated(),
  );

  const isHydrating = useCreateIdeaStore(state => state.isHydrating);
  const isSaving = useCreateIdeaStore(state => state.isSaving);
  const error = useCreateIdeaStore(state => state.error);
  const remoteMedia = useCreateIdeaStore(state => state.remoteMedia);
  const syncFromForm = useCreateIdeaStore(state => state.syncFromForm);
  const setLocalFiles = useCreateIdeaStore(state => state.setLocalFiles);
  const getFormValues = useCreateIdeaStore(state => state.getFormValues);

  const saveDraftMutation = useSaveIdeaDraftMutation();
  const initializedRef = useRef(false);

  const form = useForm<IdeaCreateFormValues>({
    resolver: zodResolver(ideaCreateSchema) as Resolver<IdeaCreateFormValues>,
    defaultValues: getFormValues(),
    mode: 'onChange',
  });

  const remoteMainImageUrl =
    remoteMedia.find(media => media.kind === 'main')?.url ?? null;

  const displayImageUrl = imagePreviewUrl ?? remoteMainImageUrl;

  useEffect(() => {
    const unsubFinish = useCreateIdeaStore.persist.onFinishHydration(() => {
      setHasStoreHydrated(true);
    });

    if (useCreateIdeaStore.persist.hasHydrated()) {
      setHasStoreHydrated(true);
    }

    return unsubFinish;
  }, []);

  useEffect(() => {
    if (!hasStoreHydrated || initializedRef.current) return;

    initializedRef.current = true;

    const init = async () => {
      const store = useCreateIdeaStore.getState();
      const draftId = store.draft.id;

      if (draftId) {
        store.setHydrating(true);
        store.setError(null);
        try {
          const idea = await fetchIdeaById(draftId);
          store.hydrateFromIdea(idea);
        } catch (err) {
          const message = getApiErrorMessage(err);
          store.setError(message);
        } finally {
          store.setHydrating(false);
        }
      }

      form.reset(useCreateIdeaStore.getState().getFormValues());
    };

    void init();
  }, [hasStoreHydrated, form]);

  useEffect(() => {
    const subscription = form.watch(values => {
      syncFromForm(values as IdeaCreateFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, syncFromForm]);

  const setMainImage = useCallback(
    (file: File | null) => {
      setImagePreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return file ? URL.createObjectURL(file) : null;
      });

      form.setValue('mainImage', file ?? undefined, {
        shouldValidate: true,
        shouldDirty: true,
      });

      setLocalFiles({ mainImage: file });
    },
    [form, setLocalFiles],
  );

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const onSaveDraft = () => {
    const values = form.getValues();
    const result = ideaCreateDraftSchema.safeParse(values);
    if (!result.success) return;
    saveDraftMutation.mutate(values);
  };

  const onPublish = form.handleSubmit((values: IdeaCreateFormValues) => {
    syncFromForm(values);
    // TODO: wire publish API
  });

  const isBusy = isHydrating || isSaving || saveDraftMutation.isPending;

  return {
    form,
    imageInputRef,
    displayImageUrl,
    isDraggingImage,
    setIsDraggingImage,
    setMainImage,
    onSaveDraft,
    onPublish,
    canPublish: form.formState.isValid,
    isBusy,
    isHydrating,
    error,
    resetCreateIdea: useCreateIdeaStore.getState().reset,
  };
}
