import {
  fieldLabelClass,
  outlineBtnClass,
  publishBtnClass,
  textareaClass,
} from '@/features/ideas/lib/styles';
import { SparklesIcon } from '@/features/ideas/ui/icons/SparklesIcon';
import { X } from 'lucide-react';

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

export type AiGenerationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  submitLabel: string;
  secondaryLabel: string;
  onSecondary: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting?: boolean;
};

export function AiGenerationModal({
  open,
  onOpenChange,
  title,
  description,
  inputLabel,
  inputPlaceholder,
  inputValue,
  onInputChange,
  submitLabel,
  secondaryLabel,
  onSecondary,
  onSubmit,
  canSubmit,
  isSubmitting = false,
}: AiGenerationModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onInputChange('');
    }
    onOpenChange(nextOpen);
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              {title}
            </DialogTitle>
            <DialogDescription className="text-brand-gray-600 text-sm">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            <div>
              <Label
                htmlFor="ai-generation-modal-input"
                className={fieldLabelClass}
              >
                {inputLabel}
              </Label>
              <textarea
                id="ai-generation-modal-input"
                className={cn(textareaClass, 'mt-2 min-h-[140px]')}
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={event => onInputChange(event.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className={outlineBtnClass}
                onClick={onSecondary}
                disabled={isSubmitting}
              >
                {secondaryLabel}
              </Button>

              <Button
                type="button"
                disabled={!canSubmit || isSubmitting}
                className={publishBtnClass}
                onClick={onSubmit}
                isLoading={isSubmitting}
              >
                <SparklesIcon className="size-5" />
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
