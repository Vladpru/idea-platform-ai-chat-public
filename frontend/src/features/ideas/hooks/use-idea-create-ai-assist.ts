import type { IdeaAIPrefillResponse } from '@/features/ideas/api/ideas-api.types';
import { generateIdeaPrefill } from '@/features/ideas/api/ideas.api';
import type { IdeaCreateFormValues } from '@/features/ideas/lib/create-idea';
import { useCallback, useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { createFileFromAiGeneratedImage } from '@/shared/api/ai/ai-generated-image';
import { generateAiImage } from '@/shared/api/ai/ai.api';
import { getApiErrorMessage } from '@/shared/api/api-error';

import type { AiGenerationModalProps } from '../ui/modals/AiGenerationModal';

export type IdeaCreateAssistMode = 'title' | 'description' | 'image';

const INVALID_MAIN_IMAGE_TYPE_MESSAGE = 'Main image must be PNG, JPEG, or WEBP';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const FILE_TOO_LARGE_MESSAGE = 'File size must be less than 5MB';

type UseIdeaCreateAiAssistParams = {
  form: UseFormReturn<IdeaCreateFormValues>;
  trimmedTitle: string;
  trimmedDescription: string;
  setMainImage: (file: File) => void;
  aiDraftPrefill?: IdeaAIPrefillResponse | null;
  onAiDraftPrefillApplied?: () => void;
};

function buildImageAssistFallbackPrompt(
  title: string,
  description: string,
): string {
  return [
    title ? `Title: ${title}` : '',
    description ? `Description: ${description}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function generateAssistImageFile(
  prompt: string,
  context: { title: string; description: string },
  aspectRatio: '16:9' | '1:1',
): Promise<File | null> {
  const generated = await generateAiImage({
    prompt,
    title: context.title || undefined,
    description: context.description || undefined,
    aspectRatio,
  });

  const file = createFileFromAiGeneratedImage(
    generated.base64,
    generated.mimeType,
  );
  if (!file) {
    toast.error(INVALID_MAIN_IMAGE_TYPE_MESSAGE);
    return null;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    toast.error(FILE_TOO_LARGE_MESSAGE);
    return null;
  }
  return file;
}

export function useIdeaCreateAiAssist({
  form,
  trimmedTitle,
  trimmedDescription,
  setMainImage,
  aiDraftPrefill,
  onAiDraftPrefillApplied,
}: UseIdeaCreateAiAssistParams) {
  const [assistModalOpen, setAssistModalOpen] = useState(false);
  const [assistMode, setAssistMode] = useState<IdeaCreateAssistMode>('title');
  const [assistPrompt, setAssistPrompt] = useState('');
  const [isAssistLoading, setIsAssistLoading] = useState(false);

  const canRegenerateTitle = trimmedDescription.length >= 8;
  const canGenerateImage = Boolean(trimmedTitle || trimmedDescription);

  const openAssistModal = (mode: IdeaCreateAssistMode) => {
    setAssistMode(mode);
    setAssistPrompt('');
    setAssistModalOpen(true);
  };

  const closeAssistModal = () => {
    setAssistPrompt('');
    setAssistModalOpen(false);
  };

  const applyGeneratedFields = useCallback(
    (generated: IdeaAIPrefillResponse) => {
      const nextTitle = generated.title.trim();
      const nextDescription = (
        generated.description || generated.problemStatement
      ).trim();
      const nextTags = generated.tags.filter(Boolean).join(', ');

      if (nextTitle) {
        form.setValue('title', nextTitle, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      if (nextDescription) {
        form.setValue('description', nextDescription, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      if (nextTags) {
        form.setValue('tags', nextTags, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [form],
  );

  const handleAssistGenerate = async () => {
    setIsAssistLoading(true);
    try {
      if (assistMode === 'image') {
        const fallbackPrompt = buildImageAssistFallbackPrompt(
          trimmedTitle,
          trimmedDescription,
        );
        const prompt =
          assistPrompt.trim() ||
          fallbackPrompt ||
          'Generate a polished cover image for this product idea.';

        const file = await generateAssistImageFile(
          prompt,
          { title: trimmedTitle, description: trimmedDescription },
          '16:9',
        );
        if (!file) return;

        form.clearErrors('mainImage');
        setMainImage(file);
        closeAssistModal();
        toast.success('Main image generated');
        return;
      }

      const fallbackPrompt =
        assistMode === 'title'
          ? `Generate a concise title for this description: ${trimmedDescription}`
          : `Generate an idea description based on this title: ${trimmedTitle}`;

      const generated = await generateIdeaPrefill({
        mode: assistMode,
        userPrompt: assistPrompt.trim() || fallbackPrompt,
        title: trimmedTitle,
        description: trimmedDescription,
      });
      applyGeneratedFields(generated);
      closeAssistModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsAssistLoading(false);
    }
  };

  useEffect(() => {
    if (!aiDraftPrefill) return;
    applyGeneratedFields(aiDraftPrefill);
    onAiDraftPrefillApplied?.();
  }, [aiDraftPrefill, applyGeneratedFields, onAiDraftPrefillApplied]);

  const generationModalProps: AiGenerationModalProps = {
    open: assistModalOpen,
    onOpenChange: setAssistModalOpen,
    title:
      assistMode === 'title'
        ? 'Generate title with AI'
        : assistMode === 'description'
          ? 'Generate description with AI'
          : 'Generate image with AI',
    description:
      assistMode === 'title'
        ? 'Provide extra context, and AI will suggest a title from your description.'
        : assistMode === 'description'
          ? 'Describe what to focus on, and AI will draft the description.'
          : 'Add creative direction, or leave blank to generate from your title and description.',
    inputLabel: 'Prompt',
    inputPlaceholder:
      assistMode === 'image'
        ? 'e.g. minimal flat illustration, warm community theme...'
        : 'Add guidance for AI generation...',
    inputValue: assistPrompt,
    onInputChange: setAssistPrompt,
    submitLabel: assistMode === 'image' ? 'Generate image' : 'Generate',
    secondaryLabel: 'Cancel',
    onSecondary: closeAssistModal,
    onSubmit: () => void handleAssistGenerate(),
    canSubmit: assistMode === 'image' ? canGenerateImage : true,
    isSubmitting: isAssistLoading,
  };

  return {
    canRegenerateTitle,
    canGenerateImage,
    openAssistModal,
    generationModalProps,
  };
}
