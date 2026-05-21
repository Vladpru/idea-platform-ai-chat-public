import {
  getAttachmentFileKey,
  MAX_ATTACHMENT_FILES,
  mergeAttachmentFiles,
} from '@/features/ideas/lib/create-idea/attachments';
import type { IdeaEditFormValues } from '@/features/ideas/lib/edit-idea';
import { IdeaAttachmentCard } from '@/features/ideas/ui/create-idea/IdeaAttachmentCard';
import { AddImageModal } from '@/features/ideas/ui/modals/AddImageModal';
import fileImageSvg from '@/assets/svg/file-image.svg';
import DeleteImageButton from '@/features/ideas/ui/create-idea/DeleteImageButton';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

type IdeaEditAttachmentsFieldProps = {
  control: Control<IdeaEditFormValues>;
  disabled?: boolean;
};

function ExistingAttachmentCard({
  url,
  filename,
  mimeTypeHint,
  onRemove,
  disabled,
}: {
  url: string;
  filename: string;
  mimeTypeHint?: string;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const isImage =
    mimeTypeHint?.startsWith('image/') === true ||
    /\.(png|jpe?g|webp|gif)$/i.test(filename);

  return (
    <div className="flex w-20 flex-col items-center gap-1.5" title={filename}>
      <div className="relative size-20 shrink-0">
        <div className="border-brand-gray-200 size-full overflow-hidden rounded-md border bg-white">
          {isImage ? (
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <img
                src={fileImageSvg}
                alt=""
                className="size-11 shrink-0"
                aria-hidden
              />
            </div>
          )}
        </div>
        <DeleteImageButton
          variant="compact"
          onClick={onRemove}
          isBusy={disabled ?? false}
          aria-label="Remove attachment"
        />
      </div>
      <span className="text-foreground line-clamp-2 w-full text-center text-xs leading-tight">
        {filename}
      </span>
    </div>
  );
}

export function IdeaEditAttachmentsField({
  control,
  disabled = false,
}: IdeaEditAttachmentsFieldProps) {
  const [addFilesOpen, setAddFilesOpen] = useState(false);

  const existingAttachments = useWatch({ control, name: 'existingAttachments' });
  const removedAttachmentIds = useWatch({ control, name: 'removedAttachmentIds' });
  const newFiles = useWatch({ control, name: 'newFiles' }) ?? [];

  const removedSet = new Set(removedAttachmentIds);
  const visibleExisting = existingAttachments.filter(
    attachment => !removedSet.has(attachment.id),
  );
  const totalCount = visibleExisting.length + newFiles.length;
  const atLimit = totalCount >= MAX_ATTACHMENT_FILES;
  const remainingSlots = MAX_ATTACHMENT_FILES - totalCount;

  return (
    <Controller
      name="newFiles"
      control={control}
      render={({ field }) => {
        const handleAdd = (incoming: File[]) => {
          const { merged, errors } = mergeAttachmentFiles(newFiles, incoming);
          if (errors.length > 0) {
            errors.forEach(message => toast.error(message));
          }
          if (merged.length !== newFiles.length) {
            field.onChange(merged);
          }
        };

        const removeNewFile = (key: string) => {
          field.onChange(
            newFiles.filter(file => getAttachmentFileKey(file) !== key),
          );
        };

        return (
          <>
            <div className="mt-2 flex flex-wrap items-start gap-3 pt-2 pr-2">
              {visibleExisting.map(attachment => (
                <Controller
                  key={attachment.id}
                  name="removedAttachmentIds"
                  control={control}
                  render={({ field: removedField }) => (
                    <ExistingAttachmentCard
                      url={attachment.url}
                      filename={attachment.filename}
                      onRemove={() => {
                        if (removedSet.has(attachment.id)) return;
                        removedField.onChange([
                          ...removedField.value,
                          attachment.id,
                        ]);
                      }}
                      disabled={disabled}
                    />
                  )}
                />
              ))}

              {newFiles.map(file => {
                const key = getAttachmentFileKey(file);
                return (
                  <IdeaAttachmentCard
                    key={key}
                    file={file}
                    disabled={disabled}
                    onRemove={() => removeNewFile(key)}
                  />
                );
              })}

              {atLimit ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled
                        className="border-brand-dark-blue text-brand-dark-blue size-20 rounded-md"
                        tabIndex={-1}
                        aria-label="Add files"
                      >
                        <Upload className="size-5" aria-hidden />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    You can add up to {MAX_ATTACHMENT_FILES} files
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={cn(
                    'border-brand-dark-blue text-brand-dark-blue size-20 rounded-md',
                  )}
                  aria-label="Add files"
                  disabled={disabled}
                  onClick={() => setAddFilesOpen(true)}
                >
                  <Upload className="size-5" aria-hidden />
                </Button>
              )}
            </div>

            <AddImageModal
              open={addFilesOpen}
              onOpenChange={setAddFilesOpen}
              maxFiles={remainingSlots}
              onAdd={handleAdd}
            />
          </>
        );
      }}
    />
  );
}
