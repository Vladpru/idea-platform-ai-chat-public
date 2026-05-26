import {
  addProblemDefaultValues,
  addProblemSchema,
  type AddProblemValues,
} from '@/features/ideas/lib/problems';
import {
  type ProblemDraft,
  useCreateProblemDraftMutation,
} from '@/features/problems';
import {
  fieldLabelClass,
  primaryBtnClass,
  publishBtnClass,
  textareaClass,
} from '@/features/ideas/lib/styles';
import { cancelOutlineBtn } from '@/features/profile/ui/profile-view-classes';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

const SAVE_TOOLTIP =
  'Enter a problem title and description to save and link this problem.';

type AddProblemModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (problem: ProblemDraft) => void;
};

export function AddProblemModal({
  open,
  onOpenChange,
  onCreated,
}: AddProblemModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<AddProblemValues>({
    resolver: zodResolver(addProblemSchema),
    defaultValues: addProblemDefaultValues,
    mode: 'onChange',
  });

  const createDraftMutation = useCreateProblemDraftMutation();

  useEffect(() => {
    if (!open) {
      reset(addProblemDefaultValues);
    }
  }, [open, reset]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const onSubmit = handleSubmit(values => {
    createDraftMutation.mutate(
      {
        title: values.title.trim(),
        description: values.description.trim(),
      },
      {
        onSuccess: problem => {
          onCreated?.(problem);
          onOpenChange(false);
        },
      },
    );
  });

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
              Define a Problem Statement
            </DialogTitle>
            <DialogDescription className="text-brand-gray-600 text-sm">
              Problem not listed? Add it here. You can add more details later.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <Label htmlFor="add-problem-title" className={fieldLabelClass}>
                Problem title
              </Label>
              <Input
                id="add-problem-title"
                className="mt-2 bg-white"
                placeholder="Keep it short and specific, e.g., 'Low visibility into equipment usage'..."
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title ? (
                <p className="text-destructive mt-1 text-xs font-medium">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="add-problem-description" className={fieldLabelClass}>
                Description
              </Label>
              <textarea
                id="add-problem-description"
                className={cn(textareaClass, 'mt-2 min-h-[120px]')}
                placeholder="Add context, why this is a problem, and who it affects..."
                aria-invalid={!!errors.description}
                {...register('description')}
              />
              {errors.description ? (
                <p className="text-destructive mt-1 text-xs font-medium">
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className={cancelOutlineBtn}
                onClick={handleClose}
              >
                Cancel
              </Button>

              {isValid ? (
                <Button
                  type="submit"
                  className={primaryBtnClass}
                  disabled={createDraftMutation.isPending}
                >
                  {createDraftMutation.isPending ? 'Saving…' : 'Save & link problem'}
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        type="button"
                        disabled
                        className={publishBtnClass}
                        tabIndex={-1}
                      >
                        Save &amp; link problem
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">{SAVE_TOOLTIP}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
