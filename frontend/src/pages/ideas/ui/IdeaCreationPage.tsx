import { IdeaCreateForm } from '@/features/ideas';
import { generateIdeaPrefill } from '@/features/ideas/api/ideas.api';
import type { IdeaAIPrefillResponse } from '@/features/ideas/api/ideas-api.types';
import { IDEA_EDITOR_QUOTE } from '@/features/ideas/lib/modals/copy';
import {
  primaryBtnClass,
} from '@/features/ideas/lib/styles';
import { SparklesIcon } from '@/features/ideas/ui/icons/SparklesIcon';
import { GenerateDraftModal } from '@/features/ideas/ui/modals/GenerateDraftModal';
import { useState } from 'react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { cn } from '@/shared/lib/utils';
import { CreationPageTemplate } from '@/shared/ui/pages/CreationPageTemplate';
import { Button } from '@/shared/ui/button';

export function IdeaCreationPage() {
  const [generateDraftOpen, setGenerateDraftOpen] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [aiDraftPrefill, setAiDraftPrefill] = useState<IdeaAIPrefillResponse | null>(
    null,
  );

  const handleGenerateDraft = async (
    prompt: string,
  ): Promise<IdeaAIPrefillResponse | null> => {
    setIsGeneratingDraft(true);
    try {
      return await generateIdeaPrefill({
        mode: 'draft',
        userPrompt: prompt,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      return null;
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  return (
    <CreationPageTemplate
      title="Idea creation"
      quote={IDEA_EDITOR_QUOTE}
      headerAction={
        <Button
          type="button"
          className={cn(primaryBtnClass, 'w-full')}
          onClick={() => setGenerateDraftOpen(true)}
        >
          <SparklesIcon className="size-5" />
          Generate draft
        </Button>
      }
      footer={
        <GenerateDraftModal
          open={generateDraftOpen}
          onOpenChange={setGenerateDraftOpen}
          isLoading={isGeneratingDraft}
          onGenerate={handleGenerateDraft}
          onGenerated={setAiDraftPrefill}
        />
      }
    >
      <IdeaCreateForm
        aiDraftPrefill={aiDraftPrefill}
        onAiDraftPrefillApplied={() => setAiDraftPrefill(null)}
      />
    </CreationPageTemplate>
  );
}
