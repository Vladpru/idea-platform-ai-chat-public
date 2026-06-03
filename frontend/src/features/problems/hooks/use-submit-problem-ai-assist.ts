import { generateIdeaPrefill } from '@/features/ideas/api/ideas.api';
import type { AiGenerationModalProps } from '@/features/ideas/ui/modals/AiGenerationModal';
import type { SubmitProblemFormValues } from '@/features/problems/lib/submit-problem';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';

export type SubmitProblemAssistMode =
  | 'title'
  | 'description'
  | 'valueProposition';

type UseSubmitProblemAiAssistParams = {
  form: UseFormReturn<SubmitProblemFormValues>;
  trimmedTitle: string;
  trimmedDescription: string;
};

export function useSubmitProblemAiAssist({
  form,
  trimmedTitle,
  trimmedDescription,
}: UseSubmitProblemAiAssistParams) {
  const [assistModalOpen, setAssistModalOpen] = useState(false);
  const [assistMode, setAssistMode] =
    useState<SubmitProblemAssistMode>('title');
  const [assistPrompt, setAssistPrompt] = useState('');
  const [isAssistLoading, setIsAssistLoading] = useState(false);

  const canRegenerateTitle = trimmedDescription.length >= 8;

  const openAssistModal = (mode: SubmitProblemAssistMode) => {
    setAssistMode(mode);
    setAssistPrompt('');
    setAssistModalOpen(true);
  };

  const closeAssistModal = () => {
    setAssistPrompt('');
    setAssistModalOpen(false);
  };

  const handleAssistGenerate = async () => {
    setIsAssistLoading(true);
    try {
      if (assistMode === 'valueProposition') {
        const fallbackPrompt = [
          trimmedTitle ? `Problem title: ${trimmedTitle}` : '',
          trimmedDescription ? `Problem description: ${trimmedDescription}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        const generated = await generateIdeaPrefill({
          mode: 'description',
          userPrompt:
            assistPrompt.trim() ||
            fallbackPrompt ||
            'Write a clear value proposition for this problem.',
          title: trimmedTitle,
          description: trimmedDescription,
        });

        const nextValueProposition = generated.description.trim();
        if (nextValueProposition) {
          form.setValue('valueProposition', nextValueProposition, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
        closeAssistModal();
        return;
      }

      const fallbackPrompt =
        assistMode === 'title'
          ? `Generate a concise problem title from this description: ${trimmedDescription}`
          : `Generate a problem description based on this title: ${trimmedTitle}`;

      const generated = await generateIdeaPrefill({
        mode: assistMode,
        userPrompt: assistPrompt.trim() || fallbackPrompt,
        title: trimmedTitle,
        description: trimmedDescription,
      });

      if (assistMode === 'title') {
        const nextTitle = generated.title.trim();
        if (nextTitle) {
          form.setValue('title', nextTitle, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      } else {
        const nextDescription = (
          generated.description || generated.problemStatement
        ).trim();
        if (nextDescription) {
          form.setValue('description', nextDescription, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      }

      closeAssistModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsAssistLoading(false);
    }
  };

  const generationModalProps: AiGenerationModalProps = {
    open: assistModalOpen,
    onOpenChange: setAssistModalOpen,
    title:
      assistMode === 'title'
        ? 'Generate problem title with AI'
        : assistMode === 'description'
          ? 'Generate description with AI'
          : 'Generate value proposition with AI',
    description:
      assistMode === 'title'
        ? 'Provide extra context, and AI will suggest a title from your description.'
        : assistMode === 'description'
          ? 'Describe what to focus on, and AI will draft the problem description.'
          : 'Add creative direction, or leave blank to generate from your title and description.',
    inputLabel: 'Prompt',
    inputPlaceholder: 'Add guidance for AI generation...',
    inputValue: assistPrompt,
    onInputChange: setAssistPrompt,
    submitLabel: 'Generate',
    secondaryLabel: 'Cancel',
    onSecondary: closeAssistModal,
    onSubmit: () => void handleAssistGenerate(),
    canSubmit: assistMode === 'title' ? canRegenerateTitle : true,
    isSubmitting: isAssistLoading,
  };

  return {
    canRegenerateTitle,
    openAssistModal,
    generationModalProps,
  };
}
