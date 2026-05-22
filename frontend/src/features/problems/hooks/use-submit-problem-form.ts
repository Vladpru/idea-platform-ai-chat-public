import { useCreateProblemDraftMutation } from '@/features/problems/hooks/use-problem-mutations';
import {
  type SubmitProblemFormValues,
  submitProblemDefaultValues,
  submitProblemDraftSchema,
  validateSubmitProblemForPublish,
} from '@/features/problems/lib/submit-problem';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export function useSubmitProblemForm() {
  const [error, setError] = useState<string | null>(null);
  const createDraftMutation = useCreateProblemDraftMutation();

  const form = useForm<SubmitProblemFormValues>({
    resolver: zodResolver(submitProblemDraftSchema),
    defaultValues: submitProblemDefaultValues,
    mode: 'onChange',
  });

  const isBusy = createDraftMutation.isPending;

  const buildDraftPayload = useCallback((values: SubmitProblemFormValues) => {
    const title = values.title?.trim();
    const description = values.description?.trim();

    return {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    };
  }, []);

  const onSaveDraft = useCallback(async () => {
    setError(null);
    const values = form.getValues();

    try {
      await createDraftMutation.mutateAsync(buildDraftPayload(values));
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return false;
    }
  }, [buildDraftPayload, createDraftMutation, form]);

  const onPublish = useCallback(async () => {
    setError(null);
    const values = form.getValues();
    const validation = validateSubmitProblemForPublish(values);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const path = firstIssue?.path[0];
      if (path && typeof path === 'string') {
        form.setError(path as keyof SubmitProblemFormValues, {
          type: 'manual',
          message: firstIssue.message,
        });
      }
      setError(firstIssue?.message ?? 'Please fix the highlighted fields');
      return false;
    }

    toast.info('Publishing problems will be available soon.');
    return false;
  }, [form]);

  const canPublish = validateSubmitProblemForPublish(form.watch()).success;

  const resetForm = useCallback(() => {
    form.reset(submitProblemDefaultValues);
    setError(null);
  }, [form]);

  return {
    form,
    error,
    isBusy,
    onSaveDraft,
    onPublish,
    canPublish,
    resetForm,
  };
}
