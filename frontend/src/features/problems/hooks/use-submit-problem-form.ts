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
  validateSubmitProblemForDraft,
  validateSubmitProblemForPublish,
} from '@/features/problems/lib/submit-problem';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import type { ZodIssue } from 'zod';

import { getApiErrorMessage } from '@/shared/api/api-error';

function applyValidationIssuesToForm(
  form: UseFormReturn<SubmitProblemFormValues>,
  issues: ZodIssue[],
) {
  for (const issue of issues) {
    const path = issue.path[0];
    if (path && typeof path === 'string') {
      form.setError(path as keyof SubmitProblemFormValues, {
        type: 'manual',
        message: issue.message,
      });
    }
  }
}

export function useSubmitProblemForm() {
  const { problemId: urlProblemId } = useSearch({ from: '/_auth/problems/new' });
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

  const form = useForm<SubmitProblemFormValues>({
    resolver: zodResolver(submitProblemDraftSchema),
    defaultValues: submitProblemDefaultValues,
    mode: 'onChange',
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!urlProblemId) {
      setIsHydrating(false);
      return;
    }

    const loadProblem = async () => {
      setIsHydrating(true);
      setError(null);

      try {
        const problem = await fetchProblemById(urlProblemId);
        setEditingProblemId(problem.id);
        setEditingProblemStatus(problem.status);
        form.reset(problemFormToSubmitFormValues(problem), { keepDirty: false });
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

  const isSavingDraft = createDraftMutation.isPending || updateMutation.isPending;
  const isPublishing = publishMutation.isPending;
  const isBusy = isHydrating || isSavingDraft || isPublishing;
  const isEditing = Boolean(editingProblemId);
  const isEditingPublished = editingProblemStatus === 'PUBLISHED';

  const clearSession = useCallback(() => {
    form.reset(submitProblemDefaultValues);
    setEditingProblemId(null);
    setEditingProblemStatus(null);
    setError(null);
  }, [form]);

  const onSaveDraft = useCallback(async () => {
    setError(null);
    const values = form.getValues();
    const validation = validateSubmitProblemForDraft(values);

    if (!validation.success) {
      applyValidationIssuesToForm(form, validation.error.issues);
      const firstIssue = validation.error.issues[0];
      setError(firstIssue?.message ?? 'Please fix the highlighted fields');
      return null;
    }

    const trimmedDescription = validation.data.description?.trim();

    try {
      let savedProblemId: string;

      if (editingProblemId) {
        const problem = await updateMutation.mutateAsync({
          title: validation.data.title,
          ...(trimmedDescription ? { description: trimmedDescription } : {}),
        });
        savedProblemId = problem.id;
      } else {
        const problem = await createDraftMutation.mutateAsync({
          title: validation.data.title,
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
  }, [clearSession, createDraftMutation, editingProblemId, form, updateMutation]);

  const onPublish = useCallback(async () => {
    setError(null);
    const values = form.getValues();
    const validation = validateSubmitProblemForPublish(values);

    if (!validation.success) {
      applyValidationIssuesToForm(form, validation.error.issues);
      const firstIssue = validation.error.issues[0];
      setError(firstIssue?.message ?? 'Please fix the highlighted fields');
      return null;
    }

    try {
      const problem = await publishMutation.mutateAsync({
        values: validation.data,
        ...(editingProblemId ? { problemId: editingProblemId } : {}),
      });
      clearSession();
      return problem.id;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return null;
    }
  }, [clearSession, editingProblemId, form, publishMutation]);

  const watchedValues = form.watch();
  const canSaveDraft = validateSubmitProblemForDraft(watchedValues).success;
  const canPublish = validateSubmitProblemForPublish(watchedValues).success;

  const resetForm = clearSession;

  return {
    form,
    error,
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
