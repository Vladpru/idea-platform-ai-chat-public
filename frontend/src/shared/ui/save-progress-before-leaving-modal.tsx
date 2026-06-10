import { outlineBtn } from '@/features/profile/ui/shared/profile-view-classes';

import {
  SAVE_PROGRESS_BEFORE_LEAVING_TITLE,
} from '@/shared/lib/create-form-leave/copy';
import { cn } from '@/shared/lib/utils';
import { AppModal } from '@/shared/ui/app-modal';
import { Button } from '@/shared/ui/button';

export type SaveProgressBeforeLeavingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSaveAsDraft: () => void;
  isSaving?: boolean;
  title?: string;
  description?: string;
};

export function SaveProgressBeforeLeavingModal({
  open,
  onOpenChange,
  onDiscard,
  onSaveAsDraft,
  isSaving = false,
  title = SAVE_PROGRESS_BEFORE_LEAVING_TITLE,
  description,
}: SaveProgressBeforeLeavingModalProps) {
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      preventClose={isSaving}
    >
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <Button
          type="button"
          variant="outline"
          className={cn(
            outlineBtn,
            'text-brand-orange border-brand-orange hover:bg-brand-orange/10 w-full px-4 py-1 sm:w-auto md:h-11 md:w-39',
          )}
          disabled={isSaving}
          onClick={onDiscard}
        >
          Discard
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-brand-dark-blue bg-brand-dark-blue hover:bg-brand-dark-blue/90 h-10 w-full rounded-sm border px-5 text-xs font-bold tracking-wide text-white uppercase disabled:cursor-not-allowed sm:w-auto sm:text-sm md:h-11 md:min-w-39"
          disabled={isSaving}
          isLoading={isSaving}
          onClick={onSaveAsDraft}
        >
          Save as Draft
        </Button>
      </div>
    </AppModal>
  );
}
