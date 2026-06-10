import { outlineBtnClass } from '@/features/ideas/lib/styles';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

export const SAVE_DRAFT_TOOLTIP = 'Enter a problem title to save as draft.';

type SaveDraftButtonProps = {
  canSave: boolean;
  isSaving: boolean;
  disabled?: boolean;
  isMobile?: boolean;
  onSave: () => void;
};

export function SaveDraftButton({
  canSave,
  isSaving,
  disabled = false,
  isMobile = false,
  onSave,
}: SaveDraftButtonProps) {
  if (isSaving) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn(outlineBtnClass, isMobile && 'w-full')}
        disabled
        isLoading
      >
        Save as draft
      </Button>
    );
  }

  if (canSave && !disabled) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn(outlineBtnClass, isMobile && 'w-full')}
        onClick={onSave}
      >
        Save as draft
      </Button>
    );
  }

  if (!canSave) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex', isMobile && 'w-full')}>
            <Button
              type="button"
              variant="outline"
              className={cn(outlineBtnClass, isMobile && 'w-full')}
              disabled
              tabIndex={-1}
            >
              Save as draft
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{SAVE_DRAFT_TOOLTIP}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(outlineBtnClass, isMobile && 'w-full')}
      disabled
    >
      Save as draft
    </Button>
  );
}
