import { useState } from 'react';

import { IdeaCreateForm } from '@/features/ideas';
import { SparklesIcon } from '@/features/ideas/ui/SparklesIcon';
import {
  GENERATE_DRAFT_SOON_TOOLTIP,
  pageTitleClass,
  primaryBtnClass,
} from '@/features/ideas/ui/idea-creation-classes';
import { GenerateDraftModal } from '@/features/ideas/ui/modals/GenerateDraftModal';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

export function IdeaCreationPage() {
  const [generateDraftOpen, setGenerateDraftOpen] = useState(false);

  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Card className="text-card-foreground bg-white p-6 md:p-10">
          <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className={pageTitleClass}>Idea creation</h1>
              <p className="text-brand-dark-blue mt-2 max-w-xl text-sm italic">
                &ldquo;Certainty of purpose is the starting point of all
                achievement&rdquo; &mdash; W. Clement Stone.
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0">
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
          </div>
          <IdeaCreateForm />
        </Card>
      </div>
      <GenerateDraftModal
        open={generateDraftOpen}
        onOpenChange={setGenerateDraftOpen}
      />
    </main>
  );
}
