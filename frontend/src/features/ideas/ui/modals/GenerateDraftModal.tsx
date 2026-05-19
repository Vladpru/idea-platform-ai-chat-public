import { SparklesIcon } from '@/features/ideas/ui/SparklesIcon';
import {
  GENERATE_DRAFT_SOON_TOOLTIP,
  fieldLabelClass,
  outlineBtnClass,
  publishBtnClass,
  textareaClass,
} from '@/features/ideas/ui/idea-creation-classes';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

const GENERATE_DESCRIPTION_TOOLTIP =
  'Enter a brief description to generate a draft.';

type GenerateDraftModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GenerateDraftModal({
  open,
  onOpenChange,
}: GenerateDraftModalProps) {
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setDescription('');
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleGenerate = () => {
    // TODO: call AI draft generation API with description
    handleClose();
  };

  const canGenerate = description.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'border-brand-gray-200 max-w-lg gap-0 rounded-lg border bg-white p-0 shadow-xl',
          'sm:max-w-[520px]',
        )}
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <div className="relative p-6 md:p-8">
          <button
            type="button"
            className="text-brand-dark-blue hover:bg-muted focus-visible:ring-ring absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Close"
            onClick={handleClose}
          >
            <X className="size-5" aria-hidden />
          </button>

          <DialogHeader className="space-y-2 pr-8 text-left">
            <DialogTitle className="text-brand-gray-900 text-xl font-bold">
              Let&apos;s start with your idea
            </DialogTitle>
            <DialogDescription className="text-brand-gray-600 text-sm">
              Describe your idea briefly, and AI will generate a draft for you
              to refine.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            <div>
              <Label
                htmlFor="generate-draft-description"
                className={fieldLabelClass}
              >
                Description
              </Label>
              <textarea
                id="generate-draft-description"
                className={cn(textareaClass, 'mt-2 min-h-[140px]')}
                placeholder="Describe your idea briefly to get started..."
                value={description}
                onChange={event => setDescription(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className={outlineBtnClass}
                onClick={handleSkip}
              >
                Skip this step
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      type="button"
                      disabled={true}
                      className={publishBtnClass}
                      tabIndex={canGenerate ? 0 : -1}
                      onClick={canGenerate ? handleGenerate : undefined}
                    >
                      <SparklesIcon className="size-5" />
                      Generate draft
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {canGenerate
                    ? GENERATE_DRAFT_SOON_TOOLTIP
                    : GENERATE_DESCRIPTION_TOOLTIP}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
