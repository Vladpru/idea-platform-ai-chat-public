import { IdeaCreateForm } from '@/features/ideas';
import { IDEA_EDITOR_QUOTE } from '@/features/ideas/lib/modals/copy';
import {
  GENERATE_DRAFT_SOON_TOOLTIP,
  primaryBtnClass,
} from '@/features/ideas/lib/styles';
import { SparklesIcon } from '@/features/ideas/ui/icons/SparklesIcon';
import { GenerateDraftModal } from '@/features/ideas/ui/modals/GenerateDraftModal';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { CreationPageTemplate } from '@/shared/ui/pages/CreationPageTemplate';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export function IdeaCreationPage() {
  const [generateDraftOpen, setGenerateDraftOpen] = useState(false);

  return (
    <CreationPageTemplate
      title="Idea creation"
      quote={IDEA_EDITOR_QUOTE}
      headerAction={
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                className={cn(primaryBtnClass, 'w-full')}
                onClick={() => setGenerateDraftOpen(true)}
              >
                <SparklesIcon className="size-5" />
                Generate draft
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {GENERATE_DRAFT_SOON_TOOLTIP}
          </TooltipContent>
        </Tooltip>
      }
      footer={
        <GenerateDraftModal
          open={generateDraftOpen}
          onOpenChange={setGenerateDraftOpen}
        />
      }
    >
      <IdeaCreateForm />
    </CreationPageTemplate>
  );
}
