import { IdeaCreateForm } from '@/features/ideas';
import type { IdeaAIPrefillResponse } from '@/features/ideas/api/ideas-api.types';
import { generateIdeaPrefill } from '@/features/ideas/api/ideas.api';
import { IDEA_EDITOR_QUOTE } from '@/features/ideas/lib/modals/copy';
import { primaryBtnClass } from '@/features/ideas/lib/styles';
import type { IdeaDocumentAutoFillControls } from '@/features/ideas/ui/create-idea/IdeaCreateForm';
import { SparklesIcon } from '@/features/ideas/ui/icons/SparklesIcon';
import { GenerateDraftModal } from '@/features/ideas/ui/modals/GenerateDraftModal';
import { useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/api/api-error';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { DocumentAutoFillControl } from '@/shared/ui/document-auto-fill-control';
import { CreationPageTemplate } from '@/shared/ui/pages/CreationPageTemplate';

export function IdeaCreationPage() {
  const { ideaId } = useSearch({ from: '/_auth/ideas/new' });
  const [generateDraftOpen, setGenerateDraftOpen] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [aiDraftPrefill, setAiDraftPrefill] =
    useState<IdeaAIPrefillResponse | null>(null);
  const [documentAutoFillControls, setDocumentAutoFillControls] =
    useState<IdeaDocumentAutoFillControls | null>(null);

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
      title={ideaId ? 'Edit Idea' : 'Idea creation'}
      quote={IDEA_EDITOR_QUOTE}
      loadingOverlay={documentAutoFillControls?.isScanning}
      loadingMessage="Scanning document and populating fields…"
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            className={cn(primaryBtnClass, 'w-full')}
            onClick={() => setGenerateDraftOpen(true)}
          >
            <SparklesIcon className="size-5" />
            Generate draft
          </Button>
          {documentAutoFillControls && (
            <DocumentAutoFillControl
              disabled={documentAutoFillControls.disabled}
              isScanning={documentAutoFillControls.isScanning}
              onFileSelected={documentAutoFillControls.handleFileSelected}
            />
          )}
        </div>
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
        onDocumentAutoFillControlsChange={setDocumentAutoFillControls}
      />
    </CreationPageTemplate>
  );
}
