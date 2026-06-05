import { fetchIdeaById } from '@/features/ideas/api/ideas.api';
import {
  usePublishIdeaMutation,
  useSaveIdeaDraftMutation,
} from '@/features/ideas/hooks/use-idea-mutations';
import {
  type IdeaCreateFormValues,
  draftToFormValues,
  getFirstPublishErrorField,
  hasCreateIdeaUnsavedProgress,
  ideaApiToDraft,
  ideaApiToRemoteMedia,
  ideaCreateDefaultValues,
  ideaCreateDraftSchema,
  validateForPublish,
} from '@/features/ideas/lib/create-idea';
import {
  type MockProblem,
  formatProblemIds,
  parseProblemIds,
} from '@/features/ideas/lib/problems';
import {
  IDEA_STATUS,
  type IdeaMediaItem,
  type IdeaStatus,
} from '@/features/ideas/model/idea.types';
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
  | {
      success: true;
      ideaId: string;
      action: 'update' | 'publish';
    }
  | {
      success: false;
      firstInvalidField?: keyof IdeaCreateFormValues;
    };

export type IdeaSaveDraftResult =
  | { success: true; ideaId: string }
  | { success: false };

export function useIdeaCreateForm() {
  const { ideaId: urlIdeaId } = useSearch({ from: '/_auth/ideas/new' });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [remoteMedia, setRemoteMedia] = useState<IdeaMediaItem[]>([]);
  const [isHydrating, setIsHydrating] = useState(Boolean(urlIdeaId));
  const [error, setError] = useState<string | null>(null);
  const [ideaStatus, setIdeaStatus] = useState<IdeaStatus>(IDEA_STATUS.DRAFT);

  const saveDraftMutation = useSaveIdeaDraftMutation();
  const publishMutation = usePublishIdeaMutation();
  const initializedRef = useRef(false);
  const [createdProblems, setCreatedProblems] = useState<MockProblem[]>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(
    urlIdeaId ?? null,
  );

  const form = useForm<IdeaCreateFormValues>({
    resolver: zodResolver(
      ideaCreateDraftSchema,
    ) as Resolver<IdeaCreateFormValues>,
    defaultValues: ideaCreateDefaultValues,
    mode: 'onChange',
  });

  const remoteMainImageUrl =
    remoteMedia.find(media => media.kind === 'main')?.url ?? null;

  const displayImageUrl = imagePreviewUrl ?? remoteMainImageUrl;

  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;

    const init = async () => {
      if (!urlIdeaId) return;

      setIsHydrating(true);
      setError(null);

      try {
        const idea = await fetchIdeaById(urlIdeaId);
        const draft = ideaApiToDraft(idea);
        const media = ideaApiToRemoteMedia(idea);

        setEditingIdeaId(draft.id);
        setIdeaStatus(draft.status);
        setRemoteMedia(media);
        form.reset(
          draftToFormValues(draft, { mainImage: null, attachments: [] }),
          {
            keepDirty: false,
          },
        );
      } catch (err) {
        setError(getApiErrorMessage(err));
        setEditingIdeaId(null);
      } finally {
        setIsHydrating(false);
      }
    };

    void init();
  }, [form, urlIdeaId]);

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
    },
    [form],
  );

  const clearMainImage = useCallback(() => {
    setMainImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    setRemoteMedia(prev => prev.filter(media => media.kind !== 'main'));
  }, [setMainImage]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const clearCreateIdeaSession = useCallback(() => {
    setEditingIdeaId(null);
    setIdeaStatus(IDEA_STATUS.DRAFT);
    setRemoteMedia([]);
    setError(null);
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
  }, [form]);

  const onSaveDraft = async (): Promise<IdeaSaveDraftResult> => {
    const values = form.getValues();
    const result = ideaCreateDraftSchema.safeParse(values);
    if (!result.success) return { success: false };

    setError(null);

    try {
      const idea = await saveDraftMutation.mutateAsync({
        values,
        ideaId: editingIdeaId,
      });
      clearCreateIdeaSession();
      return { success: true, ideaId: idea.id };
    } catch (err) {
      setError(getApiErrorMessage(err));
      return { success: false };
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
    const hasRemoteMainImage = remoteMedia.some(media => media.kind === 'main');
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

    setError(null);

    try {
      const response = await publishMutation.mutateAsync({
        values,
        ideaId: editingIdeaId,
        ideaStatus,
      });
      clearCreateIdeaSession();
      return {
        success: true,
        ideaId: response.idea.id,
        action: response.action,
      };
    } catch (err) {
      setError(getApiErrorMessage(err));
      return { success: false };
    }
  };

  const isSavingDraft = saveDraftMutation.isPending;
  const isPublishing = publishMutation.isPending;
  const isBusy = isHydrating || isSavingDraft || isPublishing;
  const watchedValues = form.watch();
  const formIsDirty = form.formState.isDirty;
  const canPublish = validateForPublish(watchedValues, {
    hasRemoteMainImage: remoteMedia.some(media => media.kind === 'main'),
  }).success;
  const isPublishedIdea = ideaStatus === IDEA_STATUS.PUBLISHED;
  const isEditing = Boolean(editingIdeaId);
  const hasUnsavedProgress = hasCreateIdeaUnsavedProgress(
    formIsDirty,
    watchedValues,
    remoteMedia,
    isEditing,
  );

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
    hasUnsavedProgress,
    clearCreateIdeaSession,
  };
}
