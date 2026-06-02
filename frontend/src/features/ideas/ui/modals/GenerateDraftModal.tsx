import { useState } from 'react';

import { AiGenerationModal } from './AiGenerationModal';

import type { IdeaAIPrefillResponse } from '@/features/ideas/api/ideas-api.types';

type GenerateDraftModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
  onGenerate: (prompt: string) => Promise<IdeaAIPrefillResponse | null>;
  onGenerated: (result: IdeaAIPrefillResponse) => void;
};

export function GenerateDraftModal({
  open,
  onOpenChange,
  isLoading = false,
  onGenerate,
  onGenerated,
}: GenerateDraftModalProps) {
  const [description, setDescription] = useState('');

  const handleClose = () => {
    setDescription('');
    onOpenChange(false);
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleGenerate = async () => {
    const result = await onGenerate(description.trim());
    if (!result) return;
    onGenerated(result);
    handleClose();
  };

  const canGenerate = description.trim().length > 0;

  return (
    <AiGenerationModal
      open={open}
      onOpenChange={onOpenChange}
      title="Let's start with your idea"
      description="Describe your idea briefly, and AI will generate a draft for you to refine."
      inputLabel="Description"
      inputPlaceholder="Describe your idea briefly to get started..."
      inputValue={description}
      onInputChange={setDescription}
      submitLabel="Generate draft"
      secondaryLabel="Skip this step"
      onSecondary={handleSkip}
      onSubmit={() => void handleGenerate()}
      canSubmit={canGenerate}
      isSubmitting={isLoading}
    />
  );
}
