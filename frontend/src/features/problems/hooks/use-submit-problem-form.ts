import { fetchProblemById } from '@/features/problems/api/problems.api';
import type { ProblemStatus } from '@/features/problems/api/problems-api.types';
import {
  useCreateProblemDraftMutation,
  usePublishProblemMutation,
  useUpdateProblemMutation,
} from '@/features/problems/hooks/use-problem-mutations';
import {
  type SubmitProblemFormValues,
  problemFormToSubmitFormValues,
  submitProblemDefaultValues,
  submitProblemDraftSchema,
  submitProblemPublishSchema,
} from '@/features/problems/lib/submit-problem';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Resolver, useForm, useWatch } from 'react-hook-form';

import { getApiErrorMessage } from '@/shared/api/api-error';

type ValidationMode = 'draft' | 'publish';

export function useSubmitProblemForm() {
  const { problemId: urlProblemId } = useSearch({
    from: '/_auth/problems/new',
  });
  const [error, setError] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(Boolean(urlProblemId));
  const [editingProblemId, setEditingProblemId] = useState<string | null>(
    urlProblemId ?? null,
  );
  const [editingProblemStatus, setEditingProblemStatus] =
    useState<ProblemStatus | null>(null);

  const createDraftMutation = useCreateProblemDraftMutation();
  const publishMutation = usePublishProblemMutation();
  const updateMutation = useUpdateProblemMutation(editingProblemId ?? '');

  const [, setValidationMode] = useState<ValidationMode>('draft');

  const validationModeRef = useRef<ValidationMode>('draft');

  const setValidationModeBoth = useCallback((mode: ValidationMode) => {
    validationModeRef.current = mode;
    setValidationMode(mode);
  }, []);

  const resolver = useMemo((): Resolver<SubmitProblemFormValues> => {
    return async (values, context, options) => {
      const schema =
        validationModeRef.current === 'publish'
          ? submitProblemPublishSchema
          : submitProblemDraftSchema;
      const nextResolver = zodResolver(
        schema,
      ) as Resolver<SubmitProblemFormValues>;
      return nextResolver(values, context, options);
    };
  }, []);

  const form = useForm<SubmitProblemFormValues>({
    resolver,
    defaultValues: submitProblemDefaultValues,
    mode: 'onChange',
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!urlProblemId) {
      return;
    }

    const loadProblem = async () => {
      setIsHydrating(true);
      setError(null);

      try {
        const problem = await fetchProblemById(urlProblemId);
        setEditingProblemId(problem.id);
        setEditingProblemStatus(problem.status);
        form.reset(problemFormToSubmitFormValues(problem), {
          keepDirty: false,
        });
      } catch (err) {
        setError(getApiErrorMessage(err));
        setEditingProblemId(null);
        setEditingProblemStatus(null);
        form.reset(submitProblemDefaultValues);
      } finally {
        setIsHydrating(false);
      }
    };

    void loadProblem();
  }, [form, urlProblemId]);

  const isSavingDraft =
    createDraftMutation.isPending || updateMutation.isPending;
  const isPublishing = publishMutation.isPending;
  const isBusy = isHydrating || isSavingDraft || isPublishing;
  const isEditing = Boolean(editingProblemId);
  const isEditingPublished = editingProblemStatus === 'PUBLISHED';

  const clearSession = useCallback(() => {
    form.reset(submitProblemDefaultValues);
    setEditingProblemId(null);
    setEditingProblemStatus(null);
    setError(null);
    setValidationModeBoth('draft');
  }, [form, setValidationModeBoth]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const onSaveDraft = useCallback(async () => {
    setError(null);
    setValidationModeBoth('draft');
    const isValid = await form.trigger(undefined, { shouldFocus: true });
    if (!isValid) {
      setError('Please fix the highlighted fields');
      return null;
    }

    const values = form.getValues();
    const trimmedDescription = values.description?.trim();

    try {
      let savedProblemId: string;

      if (editingProblemId) {
        const problem = await updateMutation.mutateAsync({
          title: values.title,
          ...(trimmedDescription ? { description: trimmedDescription } : {}),
        });
        savedProblemId = problem.id;
      } else {
        const problem = await createDraftMutation.mutateAsync({
          title: values.title,
          ...(trimmedDescription ? { description: trimmedDescription } : {}),
        });
        savedProblemId = problem.id;
      }

      clearSession();
      return savedProblemId;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return null;
    }
  }, [
    clearSession,
    createDraftMutation,
    editingProblemId,
    form,
    setValidationModeBoth,
    updateMutation,
  ]);

  const onPublish = useCallback(async () => {
    setError(null);
    setValidationModeBoth('publish');
    const isValid = await form.trigger(undefined, { shouldFocus: true });
    if (!isValid) {
      setError('Please fix the highlighted fields');
      return null;
    }

    try {
      const problem = await publishMutation.mutateAsync({
        values: form.getValues(),
        ...(editingProblemId ? { problemId: editingProblemId } : {}),
      });
      clearSession();
      return problem.id;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return null;
    }
  }, [
    clearSession,
    editingProblemId,
    form,
    publishMutation,
    setValidationModeBoth,
  ]);

  const watchedValues = useWatch({
    control: form.control,
  }) as SubmitProblemFormValues;
  const canSaveDraft =
    submitProblemDraftSchema.safeParse(watchedValues).success;
  const canPublish =
    submitProblemPublishSchema.safeParse(watchedValues).success;

  const resetForm = clearSession;

  return {
    form,
    error,
    clearError,
    isBusy,
    isHydrating,
    isSavingDraft,
    isPublishing,
    isEditing,
    isEditingPublished,
    onSaveDraft,
    onPublish,
    canSaveDraft,
    canPublish,
    clearSession,
    resetForm,
  };
}
