import {
  useCreateProblemDraftMutation,
  usePublishProblemMutation,
} from '@/features/problems/hooks/use-problem-mutations';
import {
  type SubmitProblemFormValues,
  submitProblemDefaultValues,
  submitProblemDraftSchema,
  validateSubmitProblemForDraft,
  validateSubmitProblemForPublish,
} from '@/features/problems/lib/submit-problem';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const createDraftMutation = useCreateProblemDraftMutation();
  const publishMutation = usePublishProblemMutation();

  const form = useForm<SubmitProblemFormValues>({
    resolver: zodResolver(submitProblemDraftSchema),
    defaultValues: submitProblemDefaultValues,
    mode: 'onChange',
  });

  const isSavingDraft = createDraftMutation.isPending;
  const isPublishing = publishMutation.isPending;
  const isBusy = isSavingDraft || isPublishing;

  const clearSession = useCallback(() => {
    form.reset(submitProblemDefaultValues);
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
      return false;
    }

    try {
      const trimmedDescription = validation.data.description?.trim();
      await createDraftMutation.mutateAsync({
        title: validation.data.title,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      });
      clearSession();
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return false;
    }
  }, [clearSession, createDraftMutation, form]);

  const onPublish = useCallback(async () => {
    setError(null);
    const values = form.getValues();
    const validation = validateSubmitProblemForPublish(values);

    if (!validation.success) {
      applyValidationIssuesToForm(form, validation.error.issues);
      const firstIssue = validation.error.issues[0];
      setError(firstIssue?.message ?? 'Please fix the highlighted fields');
      return false;
    }

    try {
      await publishMutation.mutateAsync(validation.data);
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return false;
    }
  }, [form, publishMutation]);

  const watchedValues = form.watch();
  const canSaveDraft = validateSubmitProblemForDraft(watchedValues).success;
  const canPublish = validateSubmitProblemForPublish(watchedValues).success;

  const resetForm = clearSession;

  return {
    form,
    error,
    isBusy,
    isSavingDraft,
    isPublishing,
    onSaveDraft,
    onPublish,
    canSaveDraft,
    canPublish,
    clearSession,
    resetForm,
  };
}
