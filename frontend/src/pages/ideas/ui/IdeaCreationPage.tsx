import { IdeaCreateForm } from '@/features/ideas';
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

const IDEA_CREATION_QUOTE =
  '\u201cCertainty of purpose is the starting point of all achievement\u201d \u2014 W. Clement Stone.';

export function IdeaCreationPage() {
  const [generateDraftOpen, setGenerateDraftOpen] = useState(false);

  return (
    <CreationPageTemplate
      title="Idea creation"
      quote={IDEA_CREATION_QUOTE}
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
