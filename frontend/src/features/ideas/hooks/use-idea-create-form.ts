import { fetchIdeaById } from '@/features/ideas/api/ideas.api';
import {
  usePublishIdeaMutation,
  useSaveIdeaDraftMutation,
} from '@/features/ideas/hooks/use-idea-mutations';
import {
  type IdeaCreateFormValues,
  getFirstPublishErrorField,
  ideaCreateDefaultValues,
  ideaCreateDraftSchema,
  validateForPublish,
} from '@/features/ideas/lib/create-idea';
import {
  type MockProblem,
  formatProblemIds,
  parseProblemIds,
} from '@/features/ideas/lib/problems';
import { IDEA_STATUS } from '@/features/ideas/model/idea.types';
import { useCreateIdeaStore } from '@/features/ideas/store/create-idea.store';
import type { ProblemDraft } from '@/features/problems';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearch } from '@tanstack/react-router';

import {
  type BaseSyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type Resolver, useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/shared/api/api-error';

export type IdeaPublishResult =
  | { success: true }
  | {
      success: false;
      firstInvalidField?: keyof IdeaCreateFormValues;
    };

export function useIdeaCreateForm() {
  const { ideaId: urlIdeaId } = useSearch({ from: '/_auth/ideas/new' });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [hasStoreHydrated, setHasStoreHydrated] = useState(() =>
    useCreateIdeaStore.persist.hasHydrated(),
  );

  const isHydrating = useCreateIdeaStore(state => state.isHydrating);
  const isSaving = useCreateIdeaStore(state => state.isSaving);
  const error = useCreateIdeaStore(state => state.error);
  const ideaStatus = useCreateIdeaStore(state => state.draft.status);
  const remoteMedia = useCreateIdeaStore(state => state.remoteMedia);
  const syncFromForm = useCreateIdeaStore(state => state.syncFromForm);
  const setLocalFiles = useCreateIdeaStore(state => state.setLocalFiles);
  const getFormValues = useCreateIdeaStore(state => state.getFormValues);

  const saveDraftMutation = useSaveIdeaDraftMutation();
  const publishMutation = usePublishIdeaMutation();
  const initializedRef = useRef(false);
  const formSyncEnabledRef = useRef(false);
  const [createdProblems, setCreatedProblems] = useState<MockProblem[]>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(
    urlIdeaId ?? null,
  );

  const form = useForm<IdeaCreateFormValues>({
    resolver: zodResolver(
      ideaCreateDraftSchema,
    ) as Resolver<IdeaCreateFormValues>,
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
      const ideaIdToLoad = urlIdeaId ?? store.draft.id;

      if (urlIdeaId && urlIdeaId !== store.draft.id) {
        store.reset();
      }

      if (ideaIdToLoad) {
        store.setHydrating(true);
        store.setError(null);
        try {
          const idea = await fetchIdeaById(ideaIdToLoad);
          store.hydrateFromIdea(idea);
        } catch (err) {
          const message = getApiErrorMessage(err);
          store.setError(message);
          setEditingIdeaId(null);
        } finally {
          store.setHydrating(false);
        }
      }

      form.reset(useCreateIdeaStore.getState().getFormValues(), {
        keepDirty: false,
      });

      const loadedDraftId = useCreateIdeaStore.getState().draft.id;
      setEditingIdeaId(loadedDraftId || null);

      const restoredMainImage =
        useCreateIdeaStore.getState().localFiles.mainImage;
      if (restoredMainImage) {
        setImagePreviewUrl(URL.createObjectURL(restoredMainImage));
      }

      formSyncEnabledRef.current = true;
    };

    void init();
  }, [hasStoreHydrated, form, urlIdeaId]);

  useEffect(() => {
    const subscription = form.watch(values => {
      if (!formSyncEnabledRef.current) return;
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
        shouldValidate: file !== null,
        shouldDirty: true,
      });

      if (!file) {
        form.clearErrors('mainImage');
      }

      setLocalFiles({ mainImage: file });
    },
    [form, setLocalFiles],
  );

  const clearMainImage = useCallback(() => {
    setMainImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    useCreateIdeaStore.setState(state => ({
      remoteMedia: state.remoteMedia.filter(media => media.kind !== 'main'),
    }));
  }, [setMainImage]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const clearCreateIdeaSession = useCallback(() => {
    formSyncEnabledRef.current = false;
    useCreateIdeaStore.getState().reset();
    setEditingIdeaId(null);
    form.reset(ideaCreateDefaultValues);
    setImagePreviewUrl(prev => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }

    queueMicrotask(() => {
      formSyncEnabledRef.current = true;
    });
  }, [form]);

  const onSaveDraft = async (): Promise<boolean> => {
    const values = form.getValues();
    const result = ideaCreateDraftSchema.safeParse(values);
    if (!result.success) return false;

    try {
      await saveDraftMutation.mutateAsync(values);
      clearCreateIdeaSession();
      return true;
    } catch {
      return false;
    }
  };

  const onProblemDraftCreated = useCallback(
    (problem: ProblemDraft) => {
      setCreatedProblems(prev => {
        if (prev.some(entry => entry.id === problem.id)) return prev;
        return [{ id: problem.id, label: problem.title }, ...prev];
      });

      const currentIds = parseProblemIds(form.getValues('problemId'));
      if (currentIds.includes(problem.id)) return;

      form.setValue(
        'problemId',
        formatProblemIds([...currentIds, problem.id]),
        { shouldValidate: true, shouldDirty: true },
      );
    },
    [form],
  );

  const onPublish = async (
    event?: BaseSyntheticEvent,
  ): Promise<IdeaPublishResult> => {
    event?.preventDefault();

    const values = form.getValues();
    const hasRemoteMainImage = useCreateIdeaStore
      .getState()
      .remoteMedia.some(media => media.kind === 'main');
    const result = validateForPublish(values, { hasRemoteMainImage });

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          form.setError(field as keyof IdeaCreateFormValues, {
            type: 'manual',
            message: issue.message,
          });
        }
      }
      return {
        success: false,
        firstInvalidField: getFirstPublishErrorField(result.error.issues),
      };
    }

    try {
      await publishMutation.mutateAsync(values);
      clearCreateIdeaSession();
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  const isSavingDraft =
    saveDraftMutation.isPending || (isSaving && !publishMutation.isPending);
  const isPublishing = publishMutation.isPending;
  const isBusy = isHydrating || isSavingDraft || isPublishing;
  const watchedValues = form.watch();
  const canPublish = validateForPublish(watchedValues, {
    hasRemoteMainImage: remoteMedia.some(media => media.kind === 'main'),
  }).success;
  const isPublishedIdea = ideaStatus === IDEA_STATUS.PUBLISHED;
  const isEditing = Boolean(editingIdeaId);

  return {
    form,
    createdProblems,
    onProblemDraftCreated,
    imageInputRef,
    displayImageUrl,
    isDraggingImage,
    setIsDraggingImage,
    setMainImage,
    clearMainImage,
    onSaveDraft,
    onPublish,
    canPublish,
    isPublishedIdea,
    isEditing,
    isBusy,
    isSavingDraft,
    isPublishing,
    isHydrating,
    error,
    clearCreateIdeaSession,
  };
}
