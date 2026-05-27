import { outlineBtnClass } from '@/features/ideas/lib/styles';

import { Button } from '@/shared/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

export const SAVE_DRAFT_TOOLTIP =
  'Enter a problem title to save as draft.';

type SaveDraftButtonProps = {
  canSave: boolean;
  isSaving: boolean;
  disabled?: boolean;
  onSave: () => void;
};

export function SaveDraftButton({
  canSave,
  isSaving,
  disabled = false,
  onSave,
}: SaveDraftButtonProps) {
  if (isSaving) {
    return (
      <Button
        type="button"
        variant="outline"
        className={outlineBtnClass}
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
        className={outlineBtnClass}
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
          <span className="inline-flex">
            <Button
              type="button"
              variant="outline"
              className={outlineBtnClass}
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
      className={outlineBtnClass}
      disabled
    >
      Save as draft
    </Button>
  );
}
